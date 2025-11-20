import { useState } from 'react';
import { generateId } from '../utils/storageUtils';

interface SupplierForm {
  name: string;
  contactPerson: string;
  email: string;
  phoneNumbers: Array<{
    type: string;
    number: string;
  }>;
  address: {
    street: string;
    zipCode: string;
    city: string;
    country: string;
  };
  website: string;
  notes: string;
  nettoPrices?: boolean;
}

interface UseSupplierFormProps {
  suppliers: any[];
  setSuppliers: React.Dispatch<React.SetStateAction<any[]>>;
  showSupplierForm: boolean;
  setShowSupplierForm: (show: boolean) => void;
  isValidUrl: (url: string) => boolean;
  openWebsite: (url: string) => void;
  saveAppData?: (data: any) => Promise<boolean>;
}

export const useSupplierForm = ({
  suppliers,
  setSuppliers,
  showSupplierForm,
  setShowSupplierForm,
  isValidUrl,
  openWebsite,
  saveAppData
}: UseSupplierFormProps) => {
  // States
  const [editingSupplier, setEditingSupplier] = useState<any>(null);
  const [supplierForm, setSupplierForm] = useState<SupplierForm>({
    name: '',
    contactPerson: '',
    email: '',
    phoneNumbers: [{ type: 'Geschäft', number: '' }],
    address: {
      street: '',
      zipCode: '',
      city: '',
      country: 'Deutschland'
    },
    website: '',
    notes: '',
    nettoPrices: false
  });

  // Functions
  const resetSupplierForm = () => {
    setSupplierForm({
      name: '',
      contactPerson: '',
      email: '',
      phoneNumbers: [{ type: 'Geschäft', number: '' }],
      address: {
        street: '',
        zipCode: '',
        city: '',
        country: 'Deutschland'
      },
      website: '',
      notes: '',
      nettoPrices: false
    });
  };

  const handleEditSupplier = (supplier: any) => {
    setEditingSupplier(supplier);
    setSupplierForm({
      name: supplier.name,
      contactPerson: supplier.contactPerson || '',
      email: supplier.email || '',
      phoneNumbers: supplier.phoneNumbers || [{ type: 'Geschäft', number: '' }],
      address: supplier.address || {
        street: '',
        zipCode: '',
        city: '',
        country: 'Deutschland'
      },
      website: supplier.website || '',
      notes: supplier.notes || '',
      nettoPrices: supplier.nettoPrices || false
    });
    setShowSupplierForm(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    resetSupplierForm();
    setShowSupplierForm(true);
  };

  const handleSaveSupplier = async () => {
    try {
      // Prüfe den aktuellen Speichermodus
      const currentStorageMode = localStorage.getItem('chef_storage_mode') as string;
      
      if (currentStorageMode === 'cloud') {
        // Speichere Lieferant über Cloud-API
        console.log(`💾 Speichere Lieferant über Cloud-API: ${supplierForm.name}`);
        
        const method = editingSupplier ? 'PUT' : 'POST';
        const url = editingSupplier 
          ? `http://localhost:3001/api/v1/suppliers/${editingSupplier.id}`
          : 'http://localhost:3001/api/v1/suppliers';
        
        const supplierToSave = {
          ...supplierForm,
          id: editingSupplier ? editingSupplier.id : generateId()
        };
        
        const response = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(supplierToSave)
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log(`✅ Lieferant erfolgreich über Cloud gespeichert:`, result.message);
        
        // Verwende die vom Cloud zurückgegebenen Daten
        const savedSupplier = result.data;
        
        setSuppliers(prev => {
          const updatedSuppliers = editingSupplier 
            ? prev.map(s => s.id === editingSupplier.id ? savedSupplier : s)
            : [...prev, savedSupplier];
          
          return updatedSuppliers;
        });
      } else {
        // Lokaler Speichermodus
        if (editingSupplier) {
          // Lieferant bearbeiten
          setSuppliers(prev => prev.map(supplier => 
            supplier.id === editingSupplier.id 
              ? { ...supplierForm, id: supplier.id }
              : supplier
          ));
        } else {
          // Neuen Lieferanten erstellen
          const newSupplier = {
            ...supplierForm,
            id: generateId()
          };
          setSuppliers(prev => [...prev, newSupplier]);
        }
      }
      
      // Speichere die aktualisierten Lieferanten im LocalStorage
      if (saveAppData) {
        const supplierToSave = {
          ...supplierForm,
          id: editingSupplier ? editingSupplier.id : generateId()
        };
        
        const updatedSuppliers = editingSupplier 
          ? suppliers.map(s => s.id === editingSupplier.id ? supplierToSave : s)
          : [...suppliers, supplierToSave];
        
        await saveAppData({ suppliers: updatedSuppliers });
        console.log('✅ Lieferanten erfolgreich im LocalStorage gespeichert');
      }
      
      setEditingSupplier(null);
      setShowSupplierForm(false);
      resetSupplierForm();
    } catch (error) {
      console.error('❌ Fehler beim Speichern des Lieferanten:', error);
      // Fallback: Lokale Speicherung
      if (editingSupplier) {
        setSuppliers(prev => prev.map(supplier => 
          supplier.id === editingSupplier.id 
            ? { ...supplierForm, id: supplier.id }
            : supplier
        ));
      } else {
        const newSupplier = {
          ...supplierForm,
          id: generateId()
        };
        setSuppliers(prev => [...prev, newSupplier]);
      }
      
      if (saveAppData) {
        const supplierToSave = {
          ...supplierForm,
          id: editingSupplier ? editingSupplier.id : generateId()
        };
        
        const updatedSuppliers = editingSupplier 
          ? suppliers.map(s => s.id === editingSupplier.id ? supplierToSave : s)
          : [...suppliers, supplierToSave];
        
        await saveAppData({ suppliers: updatedSuppliers });
      }
      
      setEditingSupplier(null);
      setShowSupplierForm(false);
      resetSupplierForm();
    }
  };

  const addPhoneNumber = () => {
    setSupplierForm(prev => ({
      ...prev,
      phoneNumbers: [...prev.phoneNumbers, { type: 'Geschäft', number: '' }]
    }));
  };

  const removePhoneNumber = (index: number) => {
    setSupplierForm(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.filter((_, i) => i !== index)
    }));
  };

  const updatePhoneNumber = (index: number, field: 'type' | 'number', value: string) => {
    setSupplierForm(prev => ({
      ...prev,
      phoneNumbers: prev.phoneNumbers.map((phone, i) => 
        i === index ? { ...phone, [field]: value } : phone
      )
    }));
  };

  return {
    // States
    editingSupplier,
    setEditingSupplier,
    supplierForm,
    setSupplierForm,

    // Functions
    resetSupplierForm,
    handleEditSupplier,
    handleNewSupplier,
    handleSaveSupplier,
    addPhoneNumber,
    removePhoneNumber,
    updatePhoneNumber,
    isValidUrl,
    openWebsite
  };
}; 