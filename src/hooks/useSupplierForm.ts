import { useState } from 'react';

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
}

interface UseSupplierFormProps {
  suppliers: any[];
  setSuppliers: React.Dispatch<React.SetStateAction<any[]>>;
  showSupplierForm: boolean;
  setShowSupplierForm: (show: boolean) => void;
  isValidUrl: (url: string) => boolean;
  openWebsite: (url: string) => void;
}

export const useSupplierForm = ({
  suppliers,
  setSuppliers,
  showSupplierForm,
  setShowSupplierForm,
  isValidUrl,
  openWebsite
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
    notes: ''
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
      notes: ''
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
      notes: supplier.notes || ''
    });
    setShowSupplierForm(true);
  };

  const handleNewSupplier = () => {
    setEditingSupplier(null);
    resetSupplierForm();
    setShowSupplierForm(true);
  };

  const handleSaveSupplier = () => {
    if (editingSupplier) {
      // Lieferant bearbeiten
      setSuppliers(prev => prev.map(supplier => 
        supplier.id === editingSupplier.id 
          ? { ...supplierForm, id: supplier.id }
          : supplier
      ));
      setEditingSupplier(null);
    } else {
      // Neuen Lieferanten erstellen
      const newSupplier = {
        ...supplierForm,
        id: Date.now().toString()
      };
      setSuppliers(prev => [...prev, newSupplier]);
    }
    setShowSupplierForm(false);
    resetSupplierForm();
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