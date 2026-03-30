import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useCompany, useCreateCompany, useUpdateCompany } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ArrowLeft, Save } from "lucide-react";
import type { CompanySize } from "@/lib/types";
import { SkeletonCard } from "@/components/ui/skeleton-card";

const sizeOptions: { value: CompanySize; label: string }[] = [
  { value: "MICRO", label: "Micro" },
  { value: "PEQUENA", label: "Pequena" },
  { value: "MEDIA", label: "Média" },
  { value: "GRANDE", label: "Grande" },
];

export default function CompanyForm() {
  const { id } = useParams();
  const isEditing = !!id;
  const navigate = useNavigate();
  const { data: existing, isLoading } = useCompany(Number(id));
  const createMutation = useCreateCompany();
  const updateMutation = useUpdateCompany();

  const [form, setForm] = useState({
    name: "",
    segment: "",
    size: "MEDIA" as CompanySize,
    responsible: "",
    responsibleEmail: "",
    responsiblePhone: "",
    cnpj: "",
    address: "",
  });

  // Populate form when editing
  useState(() => {
    if (existing) {
      setForm({
        name: existing.name,
        segment: existing.segment,
        size: existing.size,
        responsible: existing.responsible,
        responsibleEmail: existing.responsibleEmail,
        responsiblePhone: existing.responsiblePhone,
        cnpj: existing.cnpj,
        address: existing.address,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Nome da empresa é obrigatório");
      return;
    }
    try {
      if (isEditing) {
        await updateMutation.mutateAsync({ id: Number(id), ...form });
        toast.success("Empresa atualizada com sucesso");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("Empresa criada com sucesso");
      }
      navigate("/dashboard/companies");
    } catch (error: any) {
      toast.error(error.message || "Erro ao salvar empresa");
    }
  };

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  if (isEditing && isLoading) return <SkeletonCard />;

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-lg border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? "Editar Empresa" : "Nova Empresa"}
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {isEditing ? "Atualize os dados da empresa" : "Preencha os dados para cadastrar"}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="ascend-card space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Nome da Empresa *</label>
            <input
              className="ascend-input w-full"
              value={form.name}
              onChange={(e) => updateField("name", e.target.value)}
              placeholder="Nome da empresa"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Segmento</label>
            <input
              className="ascend-input w-full"
              value={form.segment}
              onChange={(e) => updateField("segment", e.target.value)}
              placeholder="Ex: Tecnologia"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Porte</label>
            <select
              className="ascend-input w-full"
              value={form.size}
              onChange={(e) => updateField("size", e.target.value)}
            >
              {sizeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Responsável</label>
            <input
              className="ascend-input w-full"
              value={form.responsible}
              onChange={(e) => updateField("responsible", e.target.value)}
              placeholder="Nome do responsável"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">E-mail do Responsável</label>
            <input
              className="ascend-input w-full"
              type="email"
              value={form.responsibleEmail}
              onChange={(e) => updateField("responsibleEmail", e.target.value)}
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">Telefone</label>
            <input
              className="ascend-input w-full"
              value={form.responsiblePhone}
              onChange={(e) => updateField("responsiblePhone", e.target.value)}
              placeholder="(00) 00000-0000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1.5">CNPJ</label>
            <input
              className="ascend-input w-full"
              value={form.cnpj}
              onChange={(e) => updateField("cnpj", e.target.value)}
              placeholder="00.000.000/0000-00"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium mb-1.5">Endereço</label>
            <input
              className="ascend-input w-full"
              value={form.address}
              onChange={(e) => updateField("address", e.target.value)}
              placeholder="Endereço completo"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate(-1)}
            className="rounded-lg"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="rounded-lg"
            disabled={createMutation.isPending || updateMutation.isPending}
          >
            <Save className="w-4 h-4 mr-2" />
            {isEditing ? "Atualizar" : "Cadastrar"}
          </Button>
        </div>
      </form>
    </div>
  );
}
