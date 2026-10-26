import React, { useState, useEffect } from 'react';
import SearchBar from './components/SearchBar';
import CardList from './components/CardList';
import ControlPanel from './components/ControlPanel';
import CardPreview from './components/CardPreview';
import ArtworkSelectionModal from './components/ArtworkSelectionModal';
import { calculatePrintLayout } from './utils/printMath';
import { getItemImage, getItemKey } from './utils/cardImages';
import Logo from './components/Logo';
import ThemeSwitcher from './components/ThemeSwitcher';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useI18n } from './utils/i18n';
import { getBacks } from './utils/api';
import DeckImportModal from './components/DeckImportModal';
import { Layers } from 'lucide-react';

export default function App() {
  const { t } = useI18n();

  // Lista de proxies a serem impressas
  const [addedCards, setAddedCards] = useState(() => {
    try {
      const saved = localStorage.getItem('ygo_proxies_queue');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Configuração das especificações da folha
  const [config, setConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('ygo_proxies_config');
      return saved ? JSON.parse(saved) : {
        sheetSize: 'A4',
        scale: 100,
        margin: 2,
        borderSize: 1,
        enableBacks: true
      };
    } catch {
      return {
        sheetSize: 'A4',
        scale: 100,
        margin: 2,
        borderSize: 1,
        enableBacks: true
      };
    }
  });

  // Estado para controlar qual carta está sendo configurada no modal de arte
  const [selectedCardForModal, setSelectedCardForModal] = useState(null);

  // Item da lista que está tendo o idioma/arte trocado
  const [editingItem, setEditingItem] = useState(null);

  // Janela de importação de deck (YDKe / .ydk)
  const [deckImportAberto, setDeckImportAberto] = useState(false);

  // Versos de carta disponíveis no servidor local
  const [availableBacks, setAvailableBacks] = useState([]);

  // Buscar versos de carta ao carregar a página
  useEffect(() => {
    async function fetchBacks() {
      try {
        const data = await getBacks();
        setAvailableBacks(data || []);
        
        // Se a configuração de verso estiver vazia, define a primeira como padrão
        if (data && data.length > 0) {
          setConfig(prev => ({
            ...prev,
            selectedBackUrl: prev.selectedBackUrl || data[0]
          }));
        }
      } catch (error) {
        console.error('Erro ao carregar versos de cartas:', error);
      }
    }
    fetchBacks();
  }, []);

  // Salvar no localStorage sempre que houver mudanças na lista ou nas configurações
  useEffect(() => {
    localStorage.setItem('ygo_proxies_queue', JSON.stringify(addedCards));
  }, [addedCards]);

  useEffect(() => {
    localStorage.setItem('ygo_proxies_config', JSON.stringify(config));
  }, [config]);

  // Abre o modal de escolha de idioma/arte ao selecionar a carta no buscador
  const handleSelectCard = (card) => {
    setSelectedCardForModal(card);
  };

  // Handler para adicionar a carta com a imagem (idioma + arte) e quantidade selecionadas
  const handleConfirmAddCard = (card, imagem, quantityToAdd) => {
    setAddedCards((prev) => {
      const exists = prev.find(
        (item) => item.id === card.id && getItemImage(item).url === imagem.url
      );
      if (exists) {
        return prev.map((item) =>
          item === exists ? { ...item, quantity: item.quantity + quantityToAdd } : item
        );
      }
      return [...prev, { ...card, quantity: quantityToAdd, imagemSelecionada: imagem }];
    });
  };

  // Importa um deck: cada item já vem com a carta, a imagem escolhida e a quantidade
  const handleImportDeck = (itens, substituir) => {
    if (substituir) setAddedCards([]);
    itens.forEach(({ card, imagem, quantidade }) => handleConfirmAddCard(card, imagem, quantidade));
  };

  // Do resumo da importação: abre o seletor de artes da carta já adicionada à lista
  const handleEditImportedCard = (cardId) => {
    const item = addedCards.find((i) => i.id === cardId);
    if (!item) return;
    setEditingItem(item); // o resumo fica escondido por baixo e volta ao salvar/cancelar
  };

  // Handler para atualizar quantidade de uma imagem específica
  const handleUpdateQuantity = (itemKey, newQty) => {
    if (newQty < 1) return;
    setAddedCards((prev) =>
      prev.map((item) => (getItemKey(item) === itemKey ? { ...item, quantity: newQty } : item))
    );
  };

  // Handler para deletar uma imagem específica
  const handleDeleteCard = (itemKey) => {
    setAddedCards((prev) => prev.filter((item) => getItemKey(item) !== itemKey));
  };

  // Handler para trocar idioma/arte (e quantidade) de um item, com merge automático
  const handleChangeImage = (itemKey, novaImagem, newQty) => {
    setAddedCards((prev) => {
      const target = prev.find((item) => getItemKey(item) === itemKey);
      if (!target) return prev;
      const updated = { ...target, imagemSelecionada: novaImagem, quantity: newQty };

      const dest = prev.find(
        (item) => item !== target && item.id === target.id && getItemImage(item).url === novaImagem.url
      );

      if (dest) {
        // Se a nova imagem já existe na fila, soma as quantidades e remove a antiga
        return prev
          .filter((item) => item !== target)
          .map((item) => (item === dest ? { ...item, quantity: item.quantity + newQty } : item));
      }
      return prev.map((item) => (item === target ? updated : item));
    });
  };

  // Handler para atualizar configurações de impressão
  const handleUpdateConfig = (newConfig) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  };

  // Limpar lista de cartas
  const handleClearList = () => {
    if (window.confirm(t('settings.confirmClear'))) {
      setAddedCards([]);
    }
  };

  // Restaurar configurações de impressão para os padrões
  const handleResetConfig = () => {
    if (window.confirm(t('settings.confirmReset'))) {
      setConfig({
        sheetSize: 'A4',
        scale: 100,
        margin: 2,
        borderSize: 1,
        enableBacks: true,
        useSafetyMargin: true,
        selectedBackUrl: availableBacks[0] || ''
      });
    }
  };

  // Acionar impressão do navegador
  const handlePrint = () => {
    window.print();
  };

  // Executa os cálculos de grade com base no estado atual
  const layoutResult = calculatePrintLayout(addedCards, config);

  // Aplica as variáveis CSS dinâmicas de impressão na tag body
  useEffect(() => {
    const root = document.documentElement;
    const printSizeMap = {
      A4: 'A4',
      A3: 'A3',
      A2: 'A2',
      A5: 'A5',
      Letter: 'letter',
      Legal: 'legal',
      Tabloid: '11in 17in'
    };
    const printSize = printSizeMap[config.sheetSize] || 'A4';
    root.style.setProperty('--page-size', printSize);
  }, [config.sheetSize]);

  return (
    <div className="app-container">
      {/* Navbar egípcia/anime */}
      <header className="navbar no-print">
        <div className="nav-brand">
          <Logo className="logo-mark" size={32} />
          <h1>Yu-Gi-Oh! <span>Proxies</span></h1>
        </div>
        <div className="nav-actions">
          <LanguageSwitcher />
          <ThemeSwitcher />
        </div>
      </header>

      <div className="layout-body">
        {/* Cartas (Esquerda): busca e lista ocupando a altura toda */}
        <aside className="control-sidebar cards-sidebar no-print">
          <div className="sidebar-scrollable">
            <SearchBar onSelectCard={handleSelectCard} />
            <button type="button" className="btn-secondary deck-import-btn" onClick={() => setDeckImportAberto(true)}>
              <Layers size={15} />
              {t('deck.button')}
            </button>
            <CardList
              addedCards={addedCards}
              onUpdateQuantity={handleUpdateQuantity}
              onDeleteCard={handleDeleteCard}
              onEditCard={setEditingItem}
            />
            {/* Rodapé */}
            <footer className="support-footer">
              <div className="footer-divider"></div>
              <p className="footer-source">
                {t('footer.ptCards')}{' '}
                <a href="https://cartascaseiras.blogspot.com/2021/04/cartas-de-yu-gi-oh-pt-br-para-imprimir.html" target="_blank" rel="noopener noreferrer">
                  Emula Animes
                </a>
                {' '}· {t('footer.enArt')}{' '}
                <a href="https://ygoprodeck.com" target="_blank" rel="noopener noreferrer">YGOPRODeck</a>
              </p>
              <p className="footer-source">
                <a href="https://github.com/lucasfrag/yugioh-proxy" target="_blank" rel="noopener noreferrer">
                  {t('footer.github')}
                </a>
              </p>
              <p className="footer-credits">Yu-Gi-Oh! Proxies &copy; {new Date().getFullYear()}</p>
            </footer>
          </div>
        </aside>

        {/* Visualização de Impressão (Centro) */}
        <main className="preview-main">
          <CardPreview
            layoutResult={layoutResult}
            borderSize={config.borderSize}
            sheetSize={config.sheetSize}
            useSafetyMargin={config.useSafetyMargin !== false}
            selectedBackUrl={config.selectedBackUrl}
          />
        </main>

        {/* Ajustes de Impressão (Direita) */}
        <aside className="control-sidebar settings-sidebar no-print">
          <div className="sidebar-scrollable">
            <ControlPanel
              config={config}
              onUpdateConfig={handleUpdateConfig}
              onClearList={handleClearList}
              onResetConfig={handleResetConfig}
              onPrint={handlePrint}
              hasCards={addedCards.length > 0}
              availableBacks={availableBacks}
            />
          </div>
        </aside>
      </div>

      {/* Modal de Seleção de Arte e Quantidade */}
      {selectedCardForModal && (
        <ArtworkSelectionModal
          card={selectedCardForModal}
          onClose={() => setSelectedCardForModal(null)}
          onConfirm={handleConfirmAddCard}
        />
      )}

      {/* Importação de deck (YDKe / .ydk) */}
      {deckImportAberto && (
        <DeckImportModal
          onClose={() => setDeckImportAberto(false)}
          onImport={handleImportDeck}
          onEditCard={handleEditImportedCard}
          oculto={!!editingItem}
        />
      )}

      {/* Modal para trocar idioma/arte de uma carta já adicionada */}
      {editingItem && (
        <ArtworkSelectionModal
          card={editingItem}
          initialImage={getItemImage(editingItem)}
          initialQuantity={editingItem.quantity}
          confirmLabel={t('modal.save')}
          onClose={() => setEditingItem(null)}
          onConfirm={(card, imagem, quantity) => handleChangeImage(getItemKey(editingItem), imagem, quantity)}
        />
      )}
    </div>
  );
}
