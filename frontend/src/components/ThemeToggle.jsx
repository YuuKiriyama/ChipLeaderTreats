import { Icons } from './Icons';
import { hapticLight } from '../utils/haptics';
import { useTheme } from '../contexts/ThemeContext';

export default function ThemeToggle({ className = '', style }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      style={style}
      onClick={() => {
        hapticLight();
        toggleTheme();
      }}
      className={`inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-xl border border-gray-200 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-200 shadow-sm backdrop-blur-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${className}`}
      aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
    >
      <span className="pointer-events-none flex size-6 items-center justify-center [&_svg]:shrink-0">
        {theme === 'dark' ? <Icons.Sun /> : <Icons.Moon />}
      </span>
    </button>
  );
}
