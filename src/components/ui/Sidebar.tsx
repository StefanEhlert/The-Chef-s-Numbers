import React from 'react';
import { FaTachometerAlt, FaDatabase, FaCalculator, FaShoppingCart, FaBoxes, FaUsers, FaShieldAlt, FaCog, FaChevronRight, FaList, FaUserFriends, FaClipboardList, FaUtensils, FaCalendarAlt, FaFileInvoice, FaWarehouse, FaThermometerHalf, FaBroom, FaExclamationTriangle, FaPalette } from 'react-icons/fa';

interface SidebarProps {
  state: any;
  dispatch: any;
  colors: any;
  accordionOpen: { 
    datenbasis: boolean; 
    kalkulation: boolean; 
    einkauf: boolean; 
    inventur: boolean; 
    personal: boolean; 
    haccp: boolean; 
    einstellungen: boolean; 
  };
  toggleAccordion: (section: 'datenbasis' | 'kalkulation' | 'einkauf' | 'inventur' | 'personal' | 'haccp' | 'einstellungen') => void;
}

const Sidebar: React.FC<SidebarProps> = ({ state, dispatch, colors, accordionOpen, toggleAccordion }) => {
  return (
    <div 
      className="sidebar"
      style={{
        position: 'fixed',
        top: 56,
        left: 0,
        width: state.sidebarOpen ? 224 : 60,
        height: 'calc(100vh - 56px)',
        backgroundColor: colors.sidebar,
        borderRight: `1px solid ${colors.cardBorder}`,
        transition: 'width 0.3s ease',
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}
    >
      
      {/* Haupt-Navigation */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <ul className="flex flex-col p-2">
          {/* Dashboard */}
          <li className="mb-0.5">
            <button 
              className={`sidebar-button ${state.currentPage === 'dashboard' ? 'active' : ''} ${state.sidebarOpen ? 'open' : 'closed'}`}
              onClick={() => { 
                dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dashboard' }); 
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Dashboard"
              style={{ color: colors.text }}
            >
              <FaTachometerAlt className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Dashboard</span>}
            </button>
          </li>

          {/* Datenbasis */}
          <li className="mb-0.5">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('datenbasis');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Datenbasis"
              style={{ color: colors.text }}
            >
              <FaDatabase className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Datenbasis</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('datenbasis');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.datenbasis ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.datenbasis && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.datenbasis && state.sidebarOpen ? '200px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'artikel' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'artikel' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Artikel"
                  >
                    <FaList style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Artikel</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'lieferanten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'lieferanten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Lieferanten"
                  >
                    <FaUsers style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Lieferanten</span>
                  </button>
                </div>
              </div>
          </li>

          {/* Kalkulation */}
          <li className="mb-0.5">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('kalkulation');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Kalkulation"
              style={{ color: colors.text }}
            >
              <FaCalculator className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Kalkulation</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('kalkulation');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.kalkulation ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.kalkulation && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.kalkulation && state.sidebarOpen ? '300px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'rezepte' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'rezepte' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Rezepte"
                  >
                    <FaUtensils style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Rezepte</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'speisekarten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'speisekarten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Speisekarten"
                  >
                    <FaClipboardList style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Speisekarten</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'menus-buffets' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'menus-buffets' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Menüs & Büffets"
                  >
                    <FaUtensils style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Menüs &amp; Büffets</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'nachkalkulationen' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'nachkalkulationen' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Nachkalkulationen"
                  >
                    <FaCalculator style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Nachkalkulationen</span>
                  </button>
                </div>
              </div>
          </li>

          {/* Einkauf */}
          <li className="mb-0.5">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('einkauf');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Einkauf"
              style={{ color: colors.text }}
            >
              <FaShoppingCart className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Einkauf</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('einkauf');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.einkauf ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.einkauf && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.einkauf && state.sidebarOpen ? '200px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'einkaufslisten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'einkaufslisten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Einkaufslisten"
                  >
                    <FaList style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Einkaufslisten</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'einkauf-planen' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'einkauf-planen' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Einkauf planen"
                  >
                    <FaCalendarAlt style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Einkauf planen</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'rechnungen' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'rechnungen' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Rechnungen"
                  >
                    <FaFileInvoice style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Rechnungen</span>
                  </button>
                </div>
              </div>
          </li>

          {/* Inventur */}
          <li className="mb-0.5">
            <button 
                className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
                onClick={() => { 
                  toggleAccordion('inventur');
                  if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                }}
                title="Inventur"
                style={{ color: colors.text }}
              >
                <FaBoxes className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Inventur</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('inventur');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.inventur ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.inventur && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.inventur && state.sidebarOpen ? '150px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'warenbestand' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'warenbestand' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Warenbestand"
                  >
                    <FaWarehouse style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Warenbestand</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'inventar-verwalten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'inventar-verwalten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Inventar verwalten"
                  >
                    <FaBoxes style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Inventar verwalten</span>
                  </button>
                </div>
              </div>
          </li>

          {/* Personal */}
          <li className="mb-0.5">
            <button 
                className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
                onClick={() => { 
                  toggleAccordion('personal');
                  if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                }}
                title="Personal"
                style={{ color: colors.text }}
              >
                <FaUsers className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Personal</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('personal');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.personal ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.personal && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.personal && state.sidebarOpen ? '250px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'personaldaten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'personaldaten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Personaldaten"
                  >
                    <FaUserFriends style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Personaldaten</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'dienstplaene' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dienstplaene' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Dienstpläne"
                  >
                    <FaCalendarAlt style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Dienstpläne</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'urlaubsplan' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'urlaubsplan' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Urlaubsplan"
                  >
                    <FaCalendarAlt style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Urlaubsplan</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'fehlzeiten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'fehlzeiten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Fehlzeiten"
                  >
                    <FaExclamationTriangle style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Fehlzeiten</span>
                  </button>
                </div>
              </div>
          </li>

          {/* HACCP */}
          <li className="mb-0.5">
            <button 
                className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
                onClick={() => { 
                  toggleAccordion('haccp');
                  if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                }}
                title="HACCP"
                style={{ color: colors.text }}
              >
                <FaShieldAlt className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>HACCP</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('haccp');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.haccp ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.haccp && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.haccp && state.sidebarOpen ? '200px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'temperaturlisten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'temperaturlisten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Temperaturlisten"
                  >
                    <FaThermometerHalf style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Temperaturlisten</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'reinigungslisten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'reinigungslisten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Reinigungslisten"
                  >
                    <FaBroom style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Reinigungslisten</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'material-verluste' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'material-verluste' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Material-Verluste"
                  >
                    <FaExclamationTriangle style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Material-Verluste</span>
                  </button>
                </div>
              </div>
          </li>
        </ul>
      </div>

      {/* Einstellungen - Bottom */}
      <div style={{ 
        borderTop: `1px solid ${colors.cardBorder}`,
        padding: '1rem'
      }}>
        <ul className="nav flex-column">
          <li className="nav-item">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('einstellungen');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Einstellungen"
              style={{ color: colors.text }}
            >
              <FaCog className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} style={{ color: colors.text }} />
              {state.sidebarOpen && <span>Einstellungen</span>}
              {state.sidebarOpen && (
                <div
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleAccordion('einstellungen');
                  }}
                  style={{
                    marginLeft: 'auto',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: '24px',
                    minHeight: '24px'
                  }}
                >
                  <FaChevronRight style={{
                    transform: accordionOpen.einstellungen ? 'rotate(90deg)' : 'rotate(0deg)',
                    transition: 'transform 0.3s ease-in-out'
                  }} />
                </div>
              )}
            </button>
            
            {/* Accordion Unterpunkte */}
            <div 
              className={`accordion-content ${accordionOpen.einstellungen && state.sidebarOpen ? 'open' : 'closed'}`}
              style={{
                maxHeight: accordionOpen.einstellungen && state.sidebarOpen ? '200px' : '0'
              }}>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'storage-management' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'storage-management' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Speicher-Verwaltung"
                  >
                    <FaCog style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Speicher-Verwaltung</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'development' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'development' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Entwicklung"
                  >
                    <FaCog style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Entwicklung</span>
                  </button>
                </div>
                <div className="mb-0.5">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'theme-test' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'theme-test' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Theme-Farben Test"
                  >
                    <FaPalette style={{ 
                      marginRight: '8px',
                      marginLeft: '4px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Theme-Farben Test</span>
                  </button>
                </div>
              </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;