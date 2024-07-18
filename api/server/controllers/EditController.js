const throttle = require('lodash/throttle');
const { getResponseSender, CacheKeys, Time } = require('librechat-data-provider');
const { createAbortController, handleAbortError } = require('~/server/middleware');
const { sendMessage, createOnProgress } = require('~/server/utils');
const { getLogStores } = require('~/cache');
const { saveMessage } = require('~/models');
const { logger } = require('~/config');

const EditController = async (req, res, next, initializeClient) => {
  let {
    text,
    generation,
    endpointOption,
    conversationId,
    modelDisplayLabel,
    responseMessageId,
    isContinued = false,
    parentMessageId = null,
    overrideParentMessageId = null,
  } = req.body;

  logger.debug('[EditController]', {
    text,
    generation,
    isContinued,
    conversationId,
    ...endpointOption,
  });

  let userMessage;
  let userMessagePromise;
  let promptTokens;
  const sender = getResponseSender({
    ...endpointOption,
    model: endpointOption.modelOptions.model,
    modelDisplayLabel,
  });
  const userMessageId = parentMessageId;
  const user = req.user.id;

  const getReqData = (data = {}) => {
    for (let key in data) {
      if (key === 'userMessage') {
        userMessage = data[key];
      } else if (key === 'userMessagePromise') {
        userMessagePromise = data[key];
      } else if (key === 'responseMessageId') {
        responseMessageId = data[key];
      } else if (key === 'promptTokens') {
        promptTokens = data[key];
      }
    }
  };

  const messageCache = getLogStores(CacheKeys.MESSAGES);
  const { onProgress: progressCallback, getPartialText } = createOnProgress({
    generation,
    onProgress: throttle(
      ({ text: partialText }) => {
        /*
          const unfinished = endpointOption.endpoint === EModelEndpoint.google ? false : true;
        {
          messageId: responseMessageId,
          sender,
          conversationId,
          parentMessageId: overrideParentMessageId ?? userMessageId,
          text: partialText,
          model: endpointOption.modelOptions.model,
          unfinished,
          isEdited: true,
          error: false,
          user,
        } */
        messageCache.set(responseMessageId, partialText, Time.FIVE_MINUTES);
      },
      3000,
      { trailing: false },
    ),
  });

  const getAbortData = () => ({
    conversationId,
    userMessagePromise,
    messageId: responseMessageId,
    sender,
    parentMessageId: overrideParentMessageId ?? userMessageId,
    text: getPartialText(),
    userMessage,
    promptTokens,
  });

  const { abortController, onStart } = createAbortController(req, res, getAbortData, getReqData);

  res.on('close', () => {
    logger.debug('[EditController] Request closed');
    if (!abortController) {
      return;
    } else if (abortController.signal.aborted) {
      return;
    } else if (abortController.requestCompleted) {
      return;
    }

    abortController.abort();
    logger.debug('[EditController] Request aborted on close');
  });

  try {
    const { client } = await initializeClient({ req, res, endpointOption });

    let response = await client.sendMessage(text, {
      user,
      generation,
      isContinued,
      isEdited: true,
      conversationId,
      parentMessageId,
      responseMessageId,
      overrideParentMessageId,
      getReqData,
      onStart,
      abortController,
      progressCallback,
      progressOptions: {
        res,
        // parentMessageId: overrideParentMessageId || userMessageId,
      },
    });

    const { conversation = {} } = await client.responsePromise;
    conversation.title =
      conversation && !conversation.title ? null : conversation?.title || 'New Chat';

    if (client.options.attachments) {
      conversation.model = endpointOption.modelOptions.model;
    }

    if (!abortController.signal.aborted) {
      sendMessage(res, {
        final: true,
        conversation,
        title: conversation.title,
        requestMessage: userMessage,
        responseMessage: response,
      });
      res.end();

      await saveMessage(
        req,
        { ...response, user },
        { context: 'api/server/controllers/EditController.js - response end' },
      );
    }
  } catch (error) {
    const partialText = getPartialText();
    handleAbortError(res, req, error, {
      partialText,
      conversationId,
      sender,
      messageId: responseMessageId,
      parentMessageId: userMessageId ?? parentMessageId,
    });
  }
};

module.exports = EditController;