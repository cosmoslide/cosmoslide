import type { PageSize } from '../types';

/**
 * Props for the PageSizeControls component.
 */
interface PageSizeControlsProps {
  /** Current page size configuration */
  pageSize: PageSize;
  /** Callback fired when page size values change */
  onChange: (pageSize: PageSize) => void;
}

/**
 * Common page size presets (all measurements in millimeters).
 */
const PAGE_PRESETS: Record<string, PageSize> = {
  A4: { width: 210, height: 297, margin: 20 },
  A5: { width: 148, height: 210, margin: 15 },
  Letter: { width: 216, height: 279, margin: 20 },
  'Slide (16:9)': { width: 254, height: 143, margin: 10 },
  'Slide (4:3)': { width: 254, height: 190, margin: 10 },
  'Custom Book': { width: 180, height: 250, margin: 15 },
};

/**
 * Controls for configuring PDF page size with preset options and custom inputs.
 *
 * All measurements are in millimeters. Includes preset templates for common
 * page sizes and allows custom configuration via input fields.
 *
 * Available presets:
 * - A4: 210x297mm (20mm margin)
 * - A5: 148x210mm (15mm margin)
 * - Letter: 216x279mm (20mm margin)
 * - Slide (16:9): 254x143mm (10mm margin)
 * - Slide (4:3): 254x190mm (10mm margin)
 * - Custom Book: 180x250mm (15mm margin)
 *
 * @example
 * ```tsx
 * const [pageSize, setPageSize] = useState({ width: 210, height: 297, margin: 20 });
 *
 * <PageSizeControls
 *   pageSize={pageSize}
 *   onChange={setPageSize}
 * />
 * ```
 */
export function PageSizeControls({
  pageSize,
  onChange,
}: PageSizeControlsProps) {
  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const preset = PAGE_PRESETS[e.target.value];
    if (preset) {
      onChange(preset);
    }
  };

  const handleInputChange =
    (field: keyof PageSize) => (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = parseFloat(e.target.value) || 0;
      onChange({ ...pageSize, [field]: value });
    };

  // Check if current size matches a preset
  const currentPreset =
    Object.entries(PAGE_PRESETS).find(
      ([, preset]) =>
        preset.width === pageSize.width &&
        preset.height === pageSize.height &&
        preset.margin === pageSize.margin,
    )?.[0] ?? 'custom';

  const inputStyle: React.CSSProperties = {
    width: '70px',
    padding: '4px 8px',
    fontSize: '13px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    textAlign: 'right',
  };

  const labelStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    fontSize: '13px',
    color: '#333',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        gap: '16px',
        padding: '8px 0',
      }}
    >
      <label style={labelStyle}>
        <span>Preset:</span>
        <select
          value={currentPreset}
          onChange={handlePresetChange}
          style={{
            padding: '4px 8px',
            fontSize: '13px',
            border: '1px solid #ddd',
            borderRadius: '4px',
            background: '#fff',
          }}
        >
          {Object.keys(PAGE_PRESETS).map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
          {currentPreset === 'custom' && (
            <option value="custom" disabled>
              Custom
            </option>
          )}
        </select>
      </label>

      <label style={labelStyle}>
        <span>Width:</span>
        <input
          type="number"
          value={pageSize.width}
          onChange={handleInputChange('width')}
          min={50}
          max={500}
          step={1}
          style={inputStyle}
        />
        <span>mm</span>
      </label>

      <label style={labelStyle}>
        <span>Height:</span>
        <input
          type="number"
          value={pageSize.height}
          onChange={handleInputChange('height')}
          min={50}
          max={500}
          step={1}
          style={inputStyle}
        />
        <span>mm</span>
      </label>

      <label style={labelStyle}>
        <span>Margin:</span>
        <input
          type="number"
          value={pageSize.margin}
          onChange={handleInputChange('margin')}
          min={0}
          max={50}
          step={1}
          style={inputStyle}
        />
        <span>mm</span>
      </label>
    </div>
  );
}
