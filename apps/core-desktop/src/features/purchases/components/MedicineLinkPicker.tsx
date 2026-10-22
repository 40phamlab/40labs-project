// [PHASE: marketplace-preview — Product catalog UI]
import * as React from 'react';
import { Medicine, CatalogProduct } from '@40labs/types';
import { Modal, Button, Input } from '@40labs/ui-components';
import { inventoryApi } from '../../../../api/inventoryApi';
import { Link2, PlusCircle, Search } from 'lucide-react';

export interface MedicineLinkPickerProps {
  isOpen: boolean;
  onClose: () => void;
  product: CatalogProduct | null;
  onLinkComplete: (medicineId: string) => void;
}

export const MedicineLinkPicker: React.FC<MedicineLinkPickerProps> = ({
  isOpen,
  onClose,
  product,
  onLinkComplete,
}) => {
  const [medicines, setMedicines] = React.useState<Medicine[]>([]);
  const [search, setSearch] = React.useState('');
  const [selectedMedId, setSelectedMedId] = React.useState<string>('');
  const [isCreatingNew, setIsCreatingNew] = React.useState(false);
  const [newMedName, setNewMedName] = React.useState('');
  const [newGeneric, setNewGeneric] = React.useState('');

  React.useEffect(() => {
    if (isOpen) {
      inventoryApi.listMedicines().then((list) => {
        setMedicines(list);
        if (list.length > 0) setSelectedMedId(list[0].id);
      });
      if (product) {
        setNewMedName(product.name);
        setNewGeneric(product.genericName);
      }
    }
  }, [isOpen, product]);

  const filteredMedicines = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return medicines;
    return medicines.filter((m) => m.name.toLowerCase().includes(q) || m.generic_name?.toLowerCase().includes(q));
  }, [medicines, search]);

  const handleConfirmLink = () => {
    if (selectedMedId) {
      onLinkComplete(selectedMedId);
      onClose();
    }
  };

  const handleCreateNew = async () => {
    if (!newMedName.trim()) return;
    const newMedId = `med_${Date.now()}`;
    onLinkComplete(newMedId);
    onClose();
  };

  if (!product) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Map Catalog Product to Inventory Medicine" size="md">
      <div className="flex flex-col gap-4 p-2 text-xs">
        <p className="text-text-muted">
          This is your first time adding <strong>{product.name}</strong>. Link it to an existing medicine in your inventory or create a new entry.
        </p>

        {!isCreatingNew ? (
          <div className="space-y-3">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search existing medicines..."
                className="pl-9 text-xs"
              />
            </div>

            <div className="max-h-48 overflow-y-auto space-y-1.5 custom-scrollbar border border-border/30 rounded-card p-2 bg-panel-strong">
              {filteredMedicines.map((m) => (
                <div
                  key={m.id}
                  onClick={() => setSelectedMedId(m.id)}
                  className={`
                    p-2 rounded cursor-pointer flex items-center justify-between transition-all
                    ${selectedMedId === m.id ? 'bg-primary text-primary-foreground font-bold' : 'hover:bg-panel text-text'}
                  `}
                >
                  <span>{m.name} ({m.generic_name})</span>
                  <span className="text-[10px] font-mono opacity-80">{m.unit}</span>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <Button intent="ghost" size="sm" onClick={() => setIsCreatingNew(true)} leftIcon={<PlusCircle size={14} />}>
                Create new medicine record
              </Button>
              <div className="flex gap-2">
                <Button intent="neutral" size="sm" onClick={onClose}>Cancel</Button>
                <Button intent="primary" size="sm" onClick={handleConfirmLink} disabled={!selectedMedId} leftIcon={<Link2 size={14} />}>
                  Link Medicine
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="font-bold text-text">Medicine Name</label>
              <Input value={newMedName} onChange={(e) => setNewMedName(e.target.value)} placeholder="Medicine Name" className="text-xs" />
            </div>
            <div className="space-y-1">
              <label className="font-bold text-text">Generic Name</label>
              <Input value={newGeneric} onChange={(e) => setNewGeneric(e.target.value)} placeholder="Generic Name" className="text-xs" />
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <Button intent="ghost" size="sm" onClick={() => setIsCreatingNew(false)}>
                Back to existing list
              </Button>
              <div className="flex gap-2">
                <Button intent="neutral" size="sm" onClick={onClose}>Cancel</Button>
                <Button intent="primary" size="sm" onClick={handleCreateNew} disabled={!newMedName.trim()}>
                  Create & Link
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
