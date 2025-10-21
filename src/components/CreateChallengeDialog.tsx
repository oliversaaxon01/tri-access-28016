import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { createChallenge } from '@/lib/db-operations';

const CATEGORIES = [
  { id: 'tecnologia', label: 'Tecnología' },
  { id: 'infraestructura', label: 'Infraestructura' },
  { id: 'sostenibilidad', label: 'Sostenibilidad' },
  { id: 'innovacion', label: 'Innovación' },
  { id: 'consultoria', label: 'Consultoría' },
];

interface CreateChallengeDialogProps {
  empresaId: string;
  onChallengeCreated: () => void;
}

export const CreateChallengeDialog = ({ empresaId, onChallengeCreated }: CreateChallengeDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    categories: [] as string[],
    budget: '',
    deadline: '',
  });

  const toggleCategory = (categoryId: string) => {
    setFormData(prev => ({
      ...prev,
      categories: prev.categories.includes(categoryId)
        ? prev.categories.filter(c => c !== categoryId)
        : [...prev.categories, categoryId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.categories.length === 0) {
      toast({
        title: 'Error',
        description: 'Debes seleccionar al menos una categoría',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);

    try {
      await createChallenge({
        empresaId,
        ...formData,
        status: 'active',
      });

      toast({
        title: 'Reto creado',
        description: 'El reto ha sido publicado exitosamente',
      });

      setFormData({ title: '', description: '', category: '', categories: [], budget: '', deadline: '' });
      setOpen(false);
      onChallengeCreated();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'No se pudo crear el reto',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" className="shadow-elegant hover:shadow-glow transition-smooth">
          <Plus className="mr-2 h-5 w-5" />
          Crear Nuevo Reto
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Reto</DialogTitle>
          <DialogDescription>
            Publica un reto para conectar con expertos especializados
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título del Reto</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Ej: Implementación de sistema de energía renovable"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe los objetivos, requisitos y expectativas del proyecto..."
              rows={4}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Categorías (Selecciona al menos una)</Label>
            <div className="grid grid-cols-2 gap-3 p-4 border rounded-lg">
              {CATEGORIES.map((cat) => (
                <div key={cat.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={cat.id}
                    checked={formData.categories.includes(cat.id)}
                    onCheckedChange={() => toggleCategory(cat.id)}
                  />
                  <Label htmlFor={cat.id} className="cursor-pointer font-normal">
                    {cat.label}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="budget">Presupuesto Estimado</Label>
              <Input
                id="budget"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                placeholder="Ej: $10,000 - $50,000"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="deadline">Fecha Límite</Label>
              <Input
                id="deadline"
                type="date"
                value={formData.deadline}
                onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isLoading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Creando...' : 'Publicar Reto'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
