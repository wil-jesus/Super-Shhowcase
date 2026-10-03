"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSkills } from "@/lib/hooks/use-musicians";

interface MusicianProfile {
  stageName: string;
  bio: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  priceMin: number | null;
  priceMax: number | null;
  skills: { id: string; name: string }[];
}

export default function EditMusicianProfilePage() {
  const { skills } = useSkills();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [stageName, setStageName] = useState("");
  const [bio, setBio] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [radius, setRadius] = useState("50");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");

  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await fetch("/api/musicians/me");
        if (!response.ok) throw new Error("Falha ao carregar perfil");
        const data: MusicianProfile = await response.json();
        setStageName(data.stageName ?? "");
        setBio(data.bio ?? "");
        setPriceMin(data.priceMin?.toString() ?? "");
        setPriceMax(data.priceMax?.toString() ?? "");
        setRadius(data.serviceRadiusKm?.toString() ?? "50");
        setLat(data.latitude?.toString() ?? "");
        setLng(data.longitude?.toString() ?? "");
        setSelectedSkills(data.skills?.map((skill) => skill.id) ?? []);
        setPhotoUrl(data.photoUrl ?? "");
      } catch {
        setError("Não foi possível carregar o perfil");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess(false);
    try {
      const response = await fetch("/api/musicians/me", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stageName,
          bio: bio || null,
          priceMin: priceMin ? Number(priceMin) : null,
          priceMax: priceMax ? Number(priceMax) : null,
          serviceRadiusKm: Number(radius),
          latitude: lat ? Number(lat) : null,
          longitude: lng ? Number(lng) : null,
          photoUrl: photoUrl || null,
          skills: selectedSkills,
        }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erro ao salvar");
      }
      setSuccess(true);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-2xl space-y-4"><Skeleton className="h-8 w-48" /><Skeleton className="h-64 w-full rounded-xl" /></div>;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Editar perfil</h1>
        <p className="text-sm text-gray-600">Atualize suas informações públicas</p>
      </div>
      {error && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{error}</p></div>}
      {success && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3"><p className="text-sm text-green-700">Perfil atualizado com sucesso!</p></div>}

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Dados básicos</h2></CardHeader>
          <CardBody className="space-y-4">
            <Input label="Nome artístico" value={stageName} onChange={(event) => setStageName(event.target.value)} placeholder="Seu nome artístico" required />
            <div><label htmlFor="bio" className="mb-1 block text-sm font-medium text-gray-700">Biografia</label><textarea id="bio" value={bio} onChange={(event) => setBio(event.target.value)} rows={4} maxLength={2000} placeholder="Conte sobre sua experiência, estilo, etc." className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500" /></div>
            <Input label="URL da foto" type="url" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." />
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Habilidades</h2></CardHeader>
          <CardBody><div className="flex flex-wrap gap-2">{skills.map((skill) => <button key={skill.id} type="button" aria-pressed={selectedSkills.includes(skill.id)} onClick={() => toggleSkill(skill.id)}><Badge color={selectedSkills.includes(skill.id) ? "blue" : "gray"}>{skill.name}</Badge></button>)}</div>{selectedSkills.length > 0 && <p className="mt-2 text-xs text-gray-400">{selectedSkills.length} habilidade(s) selecionada(s)</p>}</CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Preço e área de atendimento</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="Preço mínimo (R$)" type="number" min="0" step="0.01" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} placeholder="500" /><Input label="Preço máximo (R$)" type="number" min="0" step="0.01" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} placeholder="2000" /></div>
            <Input label="Raio de atendimento (km)" type="number" min="1" max="500" value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="50" required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="Latitude" type="number" step="any" value={lat} onChange={(event) => setLat(event.target.value)} placeholder="-23.5505" /><Input label="Longitude" type="number" step="any" value={lng} onChange={(event) => setLng(event.target.value)} placeholder="-46.6333" /></div>
          </CardBody>
        </Card>

        <div className="flex gap-3"><Button type="submit" loading={saving} size="lg" className="flex-1">Salvar perfil</Button><Button type="button" variant="ghost" size="lg" onClick={() => window.history.back()}>Cancelar</Button></div>
      </form>
    </div>
  );
}