import React from 'react';
import { Printer, Settings, Trash2, RotateCcw } from 'lucide-react';
import { PAGE_SIZES } from '../utils/printMath';
import { useI18n } from '../utils/i18n';

export default function ControlPanel({ config, onUpdateConfig, onClearList, onResetConfig, onPrint, hasCards, availableBacks }) {
  const { t } = useI18n();
  // Nomes das folhas que mudam com o idioma (A4, A3... são iguais em todos)
  const nomeFolha = (size) => (['Letter', 'Legal', 'Tabloid'].includes(size) ? t(`paper.${size}`) : PAGE_SIZES[size].name);

  const handleSelectChange = (e) => {
    onUpdateConfig({ sheetSize: e.target.value });
  };

  const handleRangeChange = (key, value) => {
    onUpdateConfig({ [key]: value });
  };

  const handleCheckboxChange = (e) => {
    onUpdateConfig({ enableBacks: e.target.checked });
  };

  return (
    <div className="control-panel">
      <div className="panel-section-header">
        <Settings size={18} className="section-icon" />
        <span className="section-title">{t('settings.title')}</span>
      </div>

      <div className="control-groups-wrapper">
        {/* Tamanho da Folha */}
        <div className="control-group">
          <label className="input-label">{t('settings.sheetSize')}</label>
          <select 
            value={config.sheetSize} 
            onChange={handleSelectChange}
            className="config-select"
          >
            {Object.keys(PAGE_SIZES).map((size) => (
              <option key={size} value={size}>
                {nomeFolha(size)} ({PAGE_SIZES[size].width}x{PAGE_SIZES[size].height} mm)
              </option>
            ))}
          </select>
        </div>

        {/* Escala da Carta */}
        <div className="control-group">
          <div className="slider-label-row">
            <label className="input-label">{t('settings.scale')}</label>
            <span className="slider-value">{config.scale}%</span>
          </div>
          <input
            type="range"
            min="70"
            max="130"
            step="1"
            value={config.scale}
            onChange={(e) => handleRangeChange('scale', parseInt(e.target.value, 10))}
            className="config-slider"
          />
          <div className="slider-limits">
            <span>70%</span>
            <span>{t('settings.scaleOriginal')}</span>
            <span>130%</span>
          </div>
        </div>

        {/* Distância entre Cartas */}
        <div className="control-group">
          <div className="slider-label-row">
            <label className="input-label">{t('settings.spacing')}</label>
            <span className="slider-value">{config.margin} mm</span>
          </div>
          <input
            type="range"
            min="0"
            max="10"
            step="0.5"
            value={config.margin}
            onChange={(e) => handleRangeChange('margin', parseFloat(e.target.value))}
            className="config-slider"
          />
          <div className="slider-limits">
            <span>0 mm</span>
            <span>5 mm</span>
            <span>10 mm</span>
          </div>
        </div>

        {/* Espessura da Borda de Corte */}
        <div className="control-group">
          <div className="slider-label-row">
            <label className="input-label">{t('settings.cutBorder')}</label>
            <span className="slider-value">{config.borderSize} mm</span>
          </div>
          <input
            type="range"
            min="0"
            max="4"
            step="2"
            value={config.borderSize}
            onChange={(e) => handleRangeChange('borderSize', parseInt(e.target.value, 10))}
            className="config-slider"
          />
          <div className="slider-limits">
            <span>{t('settings.noBorder')}</span>
            <span>2 mm</span>
            <span>4 mm</span>
          </div>
        </div>

        {/* Checkbox para Verso das Cartas */}
        <div className="control-group checkbox-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={config.enableBacks}
              onChange={handleCheckboxChange}
            />
            <span className="checkmark"></span>
            <span className="checkbox-text">{t('settings.backs')}</span>
          </label>
        </div>

        {/* Escolha do Verso se intercalar versos estiver ativo */}
        {config.enableBacks && availableBacks && availableBacks.length > 0 && (
          <div className="control-group" style={{ marginTop: '0.6rem', paddingLeft: '28px' }}>
            {/* Rótulo em cima e miniaturas quebrando linha: cabem os versos locais + os oficiais */}
            <div className="back-selector-horizontal-group" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
              <label className="input-label" style={{ marginBottom: '0' }}>{t('settings.backModel')}</label>
              <div className="back-thumbnails-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {availableBacks.map((url, idx) => {
                  const isSelected = config.selectedBackUrl === url || (!config.selectedBackUrl && idx === 0);
                  return (
                    <button
                      key={idx}
                      type="button"
                      className={`back-thumbnail-option ${isSelected ? 'selected' : ''}`}
                      onClick={() => onUpdateConfig({ selectedBackUrl: url })}
                      title={decodeURIComponent(url.substring(url.lastIndexOf('/') + 1)).replace(/\.(png|jpg|jpeg)$/i, '')}
                    >
                      <img 
                        src={url} 
                        alt={t('settings.backAlt', { n: idx + 1 })} 
                      />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Checkbox para Margem de Segurança da Folha */}
        <div className="control-group checkbox-group">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={config.useSafetyMargin !== false}
              onChange={(e) => onUpdateConfig({ useSafetyMargin: e.target.checked })}
            />
            <span className="checkmark"></span>
            <span className="checkbox-text">{t('settings.safetyMargin')}</span>
          </label>
        </div>
      </div>

      <div className="panel-actions">
        <button
          onClick={onPrint}
          disabled={!hasCards}
          className="print-btn btn"
        >
          <Printer size={18} />
          {t('settings.print')}
        </button>

        <div className="secondary-actions-row">
          <button
            onClick={onResetConfig}
            className="reset-btn btn-secondary"
            title={t('settings.resetTitle')}
          >
            <RotateCcw size={15} />
            {t('settings.reset')}
          </button>
          
          <button
            onClick={onClearList}
            disabled={!hasCards}
            className="clear-btn btn-secondary"
            title={t('settings.clearTitle')}
          >
            <Trash2 size={15} />
            {t('settings.clear')}
          </button>
        </div>
      </div>
    </div>
  );
}
