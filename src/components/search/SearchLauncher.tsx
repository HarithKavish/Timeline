import { useSearchDialog } from './SearchDialog';
import { SearchIcon } from '../ui/Icon';
import './search.css';

/**
 * A search field that is really a button. Typing happens in the dialog, so the
 * same input, keyboard model and results appear from every entry point.
 */
export function SearchLauncher({
  size = 'default',
  placeholder = 'Search creators, works, releases, films…',
}: {
  size?: 'default' | 'large' | 'compact';
  placeholder?: string;
}) {
  const { open } = useSearchDialog();

  return (
    <button
      type="button"
      className={`search-launcher search-launcher--${size}`}
      onClick={open}
      aria-label="Open search"
    >
      <SearchIcon size={size === 'large' ? 18 : 15} className="search-launcher__icon" />
      <span className="search-launcher__placeholder">{placeholder}</span>
      <kbd className="search-launcher__kbd mono">/</kbd>
    </button>
  );
}
