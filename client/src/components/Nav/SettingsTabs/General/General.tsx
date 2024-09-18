import { useRecoilState } from 'recoil';
import Cookies from 'js-cookie';
import React, { useContext, useCallback, useRef } from 'react';
import type { TDangerButtonProps } from '~/common';
import { ThemeContext, useLocalize } from '~/hooks';
import HideSidePanelSwitch from './HideSidePanelSwitch';
import AutoScrollSwitch from './AutoScrollSwitch';
import ArchivedChats from './ArchivedChats';
import { Dropdown } from '~/components/ui';
import DangerButton from '../DangerButton';
import store from '~/store';

export const ThemeSelector = ({
  theme,
  onChange,
}: {
  theme: string;
  onChange: (value: string) => void;
}) => {
  const localize = useLocalize();

  const themeOptions = [
    { value: 'system', label: localize('com_nav_theme_system') },
    { value: 'dark', label: localize('com_nav_theme_dark') },
    { value: 'light', label: localize('com_nav_theme_light') },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>{localize('com_nav_theme')}</div>

      <Dropdown
        value={theme}
        onChange={onChange}
        options={themeOptions}
        sizeClasses="w-[220px]"
        anchor="bottom start"
        testId="theme-selector"
      />
    </div>
  );
};

export const ClearChatsButton = ({
  confirmClear,
  className = '',
  showText = true,
  mutation,
  onClick,
}: Pick<
  TDangerButtonProps,
  'confirmClear' | 'mutation' | 'className' | 'showText' | 'onClick'
>) => {
  return (
    <DangerButton
      id="clearConvosBtn"
      mutation={mutation}
      confirmClear={confirmClear}
      className={className}
      showText={showText}
      infoTextCode="com_nav_clear_all_chats"
      actionTextCode="com_ui_clear"
      confirmActionTextCode="com_nav_confirm_clear"
      dataTestIdInitial="clear-convos-initial"
      dataTestIdConfirm="clear-convos-confirm"
      infoDescriptionCode="com_nav_info_clear_all_chats"
      onClick={onClick}
    />
  );
};

export const LangSelector = ({
  langcode,
  onChange,
}: {
  langcode: string;
  onChange: (value: string) => void;
}) => {
  const localize = useLocalize();

  // Create an array of options for the Dropdown
  const languageOptions = [
    { value: 'auto', label: localize('com_nav_lang_auto') },
    { value: 'en-US', label: localize('com_nav_lang_english') },
    { value: 'zh-CN', label: localize('com_nav_lang_chinese') },
    { value: 'zh-TW', label: localize('com_nav_lang_traditionalchinese') },
    { value: 'ar-EG', label: localize('com_nav_lang_arabic') },
    { value: 'de-DE', label: localize('com_nav_lang_german') },
    { value: 'es-ES', label: localize('com_nav_lang_spanish') },
    { value: 'fr-FR', label: localize('com_nav_lang_french') },
    { value: 'it-IT', label: localize('com_nav_lang_italian') },
    { value: 'pl-PL', label: localize('com_nav_lang_polish') },
    { value: 'pt-BR', label: localize('com_nav_lang_brazilian_portuguese') },
    { value: 'ru-RU', label: localize('com_nav_lang_russian') },
    { value: 'ja-JP', label: localize('com_nav_lang_japanese') },
    { value: 'sv-SE', label: localize('com_nav_lang_swedish') },
    { value: 'ko-KR', label: localize('com_nav_lang_korean') },
    { value: 'vi-VN', label: localize('com_nav_lang_vietnamese') },
    { value: 'tr-TR', label: localize('com_nav_lang_turkish') },
    { value: 'nl-NL', label: localize('com_nav_lang_dutch') },
    { value: 'id-ID', label: localize('com_nav_lang_indonesia') },
    { value: 'he-HE', label: localize('com_nav_lang_hebrew') },
    { value: 'fi-FI', label: localize('com_nav_lang_finnish') },
  ];

  return (
    <div className="flex items-center justify-between">
      <div>{localize('com_nav_language')}</div>

      <Dropdown
        value={langcode}
        onChange={onChange}
        sizeClasses="[--anchor-max-height:256px]"
        anchor="bottom start"
        options={languageOptions}
      />
    </div>
  );
};

function General() {
  const { theme, setTheme } = useContext(ThemeContext);

  const [langcode, setLangcode] = useRecoilState(store.lang);

  const contentRef = useRef(null);

  const changeTheme = useCallback(
    (value: string) => {
      setTheme(value);
    },
    [setTheme],
  );

  const changeLang = useCallback(
    (value: string) => {
      let userLang = value;
      if (value === 'auto') {
        userLang = navigator.language || navigator.languages[0];
      }

      requestAnimationFrame(() => {
        document.documentElement.lang = userLang;
      });
      setLangcode(userLang);
      Cookies.set('lang', userLang, { expires: 365 });
    },
    [setLangcode],
  );

  return (
    <div className="flex flex-col gap-3 p-1 text-sm text-text-primary">
      <div className="border-b border-border-medium pb-3 last-of-type:border-b-0">
        <ThemeSelector theme={theme} onChange={changeTheme} />
      </div>
      <div className="border-b border-border-medium pb-3 last-of-type:border-b-0">
        <LangSelector langcode={langcode} onChange={changeLang} />
      </div>
      <div className="border-b border-border-medium pb-3 last-of-type:border-b-0">
        <AutoScrollSwitch />
      </div>
      <div className="border-b border-border-medium pb-3 last-of-type:border-b-0">
        <HideSidePanelSwitch />
      </div>
      <div className="border-b border-border-medium pb-3 last-of-type:border-b-0">
        <ArchivedChats />
      </div>
      {/* <div className="border-b pb-3 last-of-type:border-b-0 border-border-medium">
        </div> */}
    </div>
  );
}

export default React.memo(General);