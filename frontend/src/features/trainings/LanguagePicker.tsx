import { useEffect, useRef, useState, type ComponentType } from 'react';
import { ChevronDown } from 'lucide-react';
import CN from 'country-flag-icons/react/3x2/CN';
import DE from 'country-flag-icons/react/3x2/DE';
import ES from 'country-flag-icons/react/3x2/ES';
import FR from 'country-flag-icons/react/3x2/FR';
import GB from 'country-flag-icons/react/3x2/GB';
import JP from 'country-flag-icons/react/3x2/JP';
import KR from 'country-flag-icons/react/3x2/KR';
import PT from 'country-flag-icons/react/3x2/PT';
import RU from 'country-flag-icons/react/3x2/RU';
import type { SupportedLanguage } from './chessboardPreferences';

type LanguageOption = {
  available: boolean;
  code: SupportedLanguage;
  countryCode: string;
  label: string;
};

type LanguagePickerProps = {
  options: LanguageOption[];
  value: SupportedLanguage;
  onChange: (nextValue: SupportedLanguage) => void;
};

const FLAG_COMPONENTS: Record<string, ComponentType<{ 'aria-hidden'?: 'true'; className?: string }>> = {
  CN,
  DE,
  ES,
  FR,
  GB,
  JP,
  KR,
  PT,
  RU,
};

function FlagIcon({ countryCode, label }: { countryCode: string; label: string }) {
  const Flag = FLAG_COMPONENTS[countryCode];
  if (!Flag) {
    return <span aria-hidden="true" className="wp-settings-v2-flag wp-settings-v2-flag--fallback" />;
  }

  return <Flag aria-hidden="true" className="wp-settings-v2-flag" />;
}

export function LanguagePicker({ onChange, options, value }: LanguagePickerProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const selectedOption = options.find((option) => option.code === value) ?? options[0];

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={rootRef} className={`wp-settings-v2-language-picker${open ? ' is-open' : ''}`}>
      <button aria-expanded={open} aria-haspopup="listbox" className="wp-settings-v2-language-picker__trigger" type="button" onClick={() => setOpen((current) => !current)}>
        <span className="wp-settings-v2-language-picker__value">
          <FlagIcon countryCode={selectedOption.countryCode} label={selectedOption.label} />
          <span>{selectedOption.label}</span>
        </span>
        <ChevronDown aria-hidden="true" className="wp-settings-v2-language-picker__chevron" size={18} strokeWidth={1.9} />
      </button>

      {open ? (
        <div className="wp-settings-v2-language-picker__menu" role="listbox">
          {options.map((option) => (
            <button
              key={option.code}
              aria-selected={option.code === value}
              className={`wp-settings-v2-language-picker__option${option.code === value ? ' is-selected' : ''}`}
              disabled={!option.available}
              role="option"
              type="button"
              onClick={() => {
                if (!option.available) {
                  return;
                }
                onChange(option.code);
                setOpen(false);
              }}
            >
              <FlagIcon countryCode={option.countryCode} label={option.label} />
              <span>{option.available ? option.label : `${option.label} — Bientôt disponible`}</span>
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

export default LanguagePicker;
