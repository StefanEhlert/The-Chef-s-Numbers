import React from 'react';
import { FaTachometerAlt, FaDatabase, FaCalculator, FaShoppingCart, FaBoxes, FaUsers, FaShieldAlt, FaCog, FaChevronRight, FaList, FaUserFriends, FaClipboardList, FaUtensils, FaCalendarAlt, FaFileInvoice, FaWarehouse, FaThermometerHalf, FaBroom, FaExclamationTriangle } from 'react-icons/fa';

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
        backgroundColor: colors.card,
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
          <li className="mb-2">
            <button 
              className={`sidebar-button ${state.currentPage === 'dashboard' ? 'active' : ''} ${state.sidebarOpen ? 'open' : 'closed'}`}
              onClick={() => { 
                dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dashboard' }); 
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Dashboard"
            >
              <FaTachometerAlt className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} />
              {state.sidebarOpen && <span>Dashboard</span>}
            </button>
          </li>

          {/* Datenbasis */}
          <li className="mb-2">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('datenbasis');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Datenbasis"
            >
              <FaDatabase className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} />
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
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'artikel' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'artikel' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Artikel"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaList style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Artikel</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'lieferanten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'lieferanten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Lieferanten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaUsers style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Lieferanten</span>
                  </button>
                </li>
              </div>
          </li>

          {/* Kalkulation */}
          <li className="mb-2">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('kalkulation');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Kalkulation"
            >
              <FaCalculator className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} />
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
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'rezepte' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'rezepte' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Rezepte"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaUtensils style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Rezepte</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'speisekarten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'speisekarten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Speisekarten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaClipboardList style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Speisekarten</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'menus-buffets' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'menus-buffets' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Menüs & Büffets"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaUtensils style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Menüs &amp; Büffets</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'nachkalkulationen' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'nachkalkulationen' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Nachkalkulationen"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaCalculator style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Nachkalkulationen</span>
                  </button>
                </li>
              </div>
          </li>

          {/* Einkauf */}
          <li className="mb-2">
            <button 
              className={`sidebar-button ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                toggleAccordion('einkauf');
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Einkauf"
            >
              <FaShoppingCart className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} />
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
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'einkaufslisten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'einkaufslisten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Einkaufslisten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaList style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Einkaufslisten</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'einkauf-planen' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'einkauf-planen' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Einkauf planen"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaCalendarAlt style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Einkauf planen</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'rechnungen' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'rechnungen' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Rechnungen"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaFileInvoice style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Rechnungen</span>
                  </button>
                </li>
              </div>
          </li>

          {/* Inventur */}
          <li className="mb-2">
            <button 
                className={`sidebar-button ${state.currentPage === 'inventur' ? 'active' : ''}`} 
                onClick={() => { 
                  dispatch({ type: 'SET_CURRENT_PAGE', payload: 'inventur' }); 
                  if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                }}
                title="Inventur"
                style={{ 
                  color: colors.text,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: state.sidebarOpen ? '12px' : '2px',
                width: '100%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaBoxes className="sidebar-icon" style={{ 
                marginRight: state.sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: state.sidebarOpen ? 'auto' : '100%'
              }} />
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
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'warenbestand' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'warenbestand' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Warenbestand"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaWarehouse style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Warenbestand</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'inventar-verwalten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'inventar-verwalten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Inventar verwalten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaBoxes style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Inventar verwalten</span>
                  </button>
                </li>
              </div>
          </li>

          {/* Personal */}
          <li className="mb-2">
            <button 
                className={`sidebar-button ${state.currentPage === 'personal' ? 'active' : ''}`} 
                onClick={() => { 
                  dispatch({ type: 'SET_CURRENT_PAGE', payload: 'personal' }); 
                  if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                }}
                title="Personal"
                style={{ 
                  color: colors.text,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: state.sidebarOpen ? '12px' : '2px',
                width: '100%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaUsers className="sidebar-icon" style={{ 
                marginRight: state.sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: state.sidebarOpen ? 'auto' : '100%'
              }} />
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
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'personaldaten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'personaldaten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Personaldaten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaUserFriends style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Personaldaten</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'dienstplaene' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'dienstplaene' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Dienstpläne"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaCalendarAlt style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Dienstpläne</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'urlaubsplan' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'urlaubsplan' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Urlaubsplan"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaCalendarAlt style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Urlaubsplan</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'fehlzeiten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'fehlzeiten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Fehlzeiten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaExclamationTriangle style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Fehlzeiten</span>
                  </button>
                </li>
              </div>
          </li>

          {/* HACCP */}
          <li className="mb-2">
            <button 
                className={`sidebar-button ${state.currentPage === 'haccp' ? 'active' : ''}`} 
                onClick={() => { 
                  dispatch({ type: 'SET_CURRENT_PAGE', payload: 'haccp' }); 
                  if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                }}
                title="HACCP"
                style={{ 
                  color: colors.text,
                  borderRadius: '8px',
                  backgroundColor: 'transparent',
                justifyContent: state.sidebarOpen ? 'flex-start' : 'center',
                minHeight: '50px',
                border: 'none',
                outline: 'none',
                padding: state.sidebarOpen ? '12px' : '2px',
                width: '100%',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <FaShieldAlt className="sidebar-icon" style={{ 
                marginRight: state.sidebarOpen ? '12px' : '0',
                display: 'block',
                flexShrink: 0,
                fontSize: '18px',
                fontWeight: 'bold',
                color: colors.text,
                minWidth: '18px',
                textAlign: 'center',
                width: state.sidebarOpen ? 'auto' : '100%'
              }} />
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
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'temperaturlisten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'temperaturlisten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Temperaturlisten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaThermometerHalf style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Temperaturlisten</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'reinigungslisten' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'reinigungslisten' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Reinigungslisten"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaBroom style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Reinigungslisten</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'material-verluste' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'material-verluste' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Material-Verluste"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaExclamationTriangle style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Material-Verluste</span>
                  </button>
                </li>
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
              className={`sidebar-button ${state.currentPage === 'storage-management' ? 'active' : ''} ${state.sidebarOpen ? 'open' : 'closed'}`} 
              onClick={() => { 
                dispatch({ type: 'SET_CURRENT_PAGE', payload: 'storage-management' }); 
                if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
              }}
              title="Einstellungen"
            >
              <FaCog className={`sidebar-icon ${state.sidebarOpen ? 'open' : 'closed'}`} />
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
                maxHeight: accordionOpen.einstellungen && state.sidebarOpen ? '150px' : '0'
              }}>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'storage-management' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'storage-management' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Speicher-Verwaltung"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaCog style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Speicher-Verwaltung</span>
                  </button>
                </li>
                <li className="mb-1">
                  <button 
                    className={`sidebar-sub-button ${state.currentPage === 'development' ? 'active' : ''}`}
                    onClick={() => { 
                      dispatch({ type: 'SET_CURRENT_PAGE', payload: 'development' }); 
                      if (state.isMobile) dispatch({ type: 'SET_SIDEBAR_OPEN', payload: false }); 
                    }}
                    title="Entwicklung"
                    style={{ 
                      color: colors.text,
                      borderRadius: '6px',
                      backgroundColor: 'transparent',
                      justifyContent: 'flex-start',
                      minHeight: '40px',
                      border: 'none',
                      outline: 'none',
                      padding: '8px 12px',
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      fontSize: '14px'
                    }}
                  >
                    <FaCog style={{ 
                      marginRight: '8px',
                      fontSize: '14px',
                      color: colors.text
                    }} />
                    <span>Entwicklung</span>
                  </button>
                </li>
              </div>
          </li>
        </ul>
      </div>
    </div>
  );
};

export default Sidebar;