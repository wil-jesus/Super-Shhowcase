

"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { useSkills } from "@/lib/hooks/use-musicians";

interface MusicianProfile {
  id: string;
  stageName: string;
  bio: string | null;
  photoUrl: string | null;
  latitude: number | null;
  longitude: number | null;
  serviceRadiusKm: number;
  priceMin: number | null;
  priceMax: number | null;
  skills: { id: string; name: string }[];
  genres: { id: string; name: string }[];
}

interface PortfolioMedia {
  id: string;
  type: "IMAGE" | "VIDEO" | "AUDIO";
  url: string;
}

type MediaType = "IMAGE" | "VIDEO" | "AUDIO";

const ACCEPT_BY_TYPE: Record<MediaType, string> = {
  IMAGE: "image/jpeg,image/png,image/webp",
  VIDEO: "video/mp4,video/webm",
  AUDIO: "audio/mpeg,audio/wav",
};

export default function EditMusicianProfilePage() {
  const { skills } = useSkills();
  const [genres, setGenres] = useState<{ id: string; name: string }[]>([]);
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
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState("");
  const [musicianId, setMusicianId] = useState("");
  const [medias, setMedias] = useState<PortfolioMedia[]>([]);
  const [mediaType, setMediaType] = useState<MediaType>("VIDEO");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaBusy, setMediaBusy] = useState(false);
  const [mediaError, setMediaError] = useState("");
  const [mediaSuccess, setMediaSuccess] = useState("");
  // remonta o <input type="file"> para o nome exibido acompanhar o estado mediaFile
  const [fileInputKey, setFileInputKey] = useState(0);
  const [locating, setLocating] = useState(false);

  async function loadMedia(id: string) {
    try {
      const response = await fetch(`/api/musicians/${id}/media`);
      if (!response.ok) return;
      const json = await response.json();
      setMedias(Array.isArray(json?.data) ? json.data : []);
    } catch {
      // lista fica vazia em caso de falha de rede
    }
  }

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
        setSelectedGenres(data.genres?.map((genre) => genre.id) ?? []);
        setPhotoUrl(data.photoUrl ?? "");
        setMusicianId(data.id ?? "");
        if (data.id) await loadMedia(data.id);
      } catch {
        setError("Não foi possível carregar o perfil");
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  useEffect(() => {
    async function loadGenres() {
      try {
        const response = await fetch("/api/genres");
        if (!response.ok) return;
        const json = await response.json();
        setGenres(Array.isArray(json?.data) ? json.data : []);
      } catch {
        // sem gêneros disponíveis: a seção simplesmente fica vazia
      }
    }
    loadGenres();
  }, []);

  const toggleSkill = (skillId: string) => {
    setSelectedSkills((current) =>
      current.includes(skillId) ? current.filter((id) => id !== skillId) : [...current, skillId],
    );
  };

  const toggleGenre = (genreId: string) => {
    setSelectedGenres((current) =>
      current.includes(genreId) ? current.filter((id) => id !== genreId) : [...current, genreId],
    );
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      setError("Seu navegador não suporta geolocalização");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLat(position.coords.latitude.toFixed(6));
        setLng(position.coords.longitude.toFixed(6));
        setLocating(false);
      },
      () => {
        setError("Não foi possível obter sua localização. Verifique a permissão do navegador.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  async function saveProfile(photoOverride?: string) {
    setError("");
    setSuccess(false);
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
        photoUrl: photoOverride ?? (photoUrl || null),
        skills: selectedSkills,
        genres: selectedGenres,
      }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null);
      throw new Error(body?.error ?? "Erro ao salvar");
    }
    setSuccess(true);
  }

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      await saveProfile();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleMediaUpload = async () => {
    setMediaSuccess("");
    if (!mediaFile) {
      setMediaError("Escolha um arquivo primeiro");
      return;
    }
    if (!musicianId) {
      setMediaError("Perfil ainda não carregado. Recarregue a página e tente de novo.");
      return;
    }
    setMediaBusy(true);
    setMediaError("");
    try {
      const formData = new FormData();
      formData.append("file", mediaFile);
      formData.append("type", mediaType);
      const response = await fetch(`/api/musicians/${musicianId}/media`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erro ao enviar arquivo");
      }
      setMediaFile(null);
      setFileInputKey((key) => key + 1);
      setMediaSuccess("Mídia enviada!");
      await loadMedia(musicianId);
    } catch (uploadError) {
      setMediaError(uploadError instanceof Error ? uploadError.message : "Erro ao enviar arquivo");
    } finally {
      setMediaBusy(false);
    }
  };

  const handleMediaDelete = async (mediaId: string) => {
    if (!musicianId) return;
    if (!window.confirm("Remover esta mídia do seu portfólio?")) return;
    setMediaBusy(true);
    setMediaError("");
    setMediaSuccess("");
    try {
      const response = await fetch(`/api/musicians/${musicianId}/media`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        throw new Error(body?.error ?? "Erro ao remover");
      }
      await loadMedia(musicianId);
    } catch (deleteError) {
      setMediaError(deleteError instanceof Error ? deleteError.message : "Erro ao remover");
    } finally {
      setMediaBusy(false);
    }
  };

  const handleSetAvatar = async (url: string) => {
    setSaving(true);
    setError("");
    try {
      setPhotoUrl(url);
      await saveProfile(url);
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Erro ao definir foto");
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
            <div className="flex items-center gap-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {photoUrl ? <img src={photoUrl} alt="Foto de perfil" className="h-16 w-16 flex-shrink-0 rounded-full object-cover" /> : <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl text-gray-400">👤</div>}
              <div className="flex-1"><Input label="URL da foto (ou defina pelo Portfólio abaixo)" type="url" value={photoUrl} onChange={(event) => setPhotoUrl(event.target.value)} placeholder="https://..." /></div>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Habilidades (instrumentos e funções)</h2></CardHeader>
          <CardBody><div className="flex flex-wrap gap-2">{skills.map((skill) => <button key={skill.id} type="button" aria-pressed={selectedSkills.includes(skill.id)} onClick={() => toggleSkill(skill.id)}><Badge color={selectedSkills.includes(skill.id) ? "blue" : "gray"}>{skill.name}</Badge></button>)}</div>{selectedSkills.length > 0 && <p className="mt-2 text-xs text-gray-400">{selectedSkills.length} habilidade(s) selecionada(s)</p>}{skills.length === 0 && <p className="text-sm text-gray-500">Nenhuma habilidade disponível no catálogo — precisa popular a tabela Skill.</p>}</CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Estilos musicais (gêneros)</h2></CardHeader>
          <CardBody><div className="flex flex-wrap gap-2">{genres.map((genre) => <button key={genre.id} type="button" aria-pressed={selectedGenres.includes(genre.id)} onClick={() => toggleGenre(genre.id)}><Badge color={selectedGenres.includes(genre.id) ? "purple" : "gray"}>{genre.name}</Badge></button>)}</div>{selectedGenres.length > 0 && <p className="mt-2 text-xs text-gray-400">{selectedGenres.length} gênero(s) selecionado(s)</p>}{genres.length === 0 && <p className="text-sm text-gray-500">Nenhum gênero disponível no catálogo — precisa popular a tabela Genre.</p>}</CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Portfólio (vídeos, áudios e fotos)</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="mediaType" className="mb-1 block text-sm font-medium text-gray-700">Tipo</label>
                <select id="mediaType" value={mediaType} onChange={(event) => { setMediaType(event.target.value as MediaType); setMediaFile(null); setFileInputKey((key) => key + 1); setMediaSuccess(""); setMediaError(""); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500">
                  <option value="VIDEO">Vídeo</option>
                  <option value="AUDIO">Áudio</option>
                  <option value="IMAGE">Foto</option>
                </select>
              </div>
              <div>
                <label htmlFor="mediaFile" className="mb-1 block text-sm font-medium text-gray-700">Arquivo</label>
                <input key={fileInputKey} id="mediaFile" type="file" accept={ACCEPT_BY_TYPE[mediaType]} onChange={(event) => setMediaFile(event.target.files?.[0] ?? null)} className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-sm file:font-medium file:text-brand-700" />
              </div>
              <div className="flex items-end"><Button type="button" loading={mediaBusy} onClick={handleMediaUpload} className="w-full">Enviar</Button></div>
            </div>
            {mediaSuccess && <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3"><p className="text-sm text-green-700">{mediaSuccess}</p></div>}
            {mediaError && <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3"><p className="text-sm text-red-700">{mediaError}</p></div>}
            <div className="space-y-2">
              {medias.length === 0 && <p className="text-sm text-gray-500">Nenhuma mídia no portfólio ainda. Um vídeo tocando é o que mais impressiona clientes!</p>}
              {medias.map((media) => (
                <div key={media.id} className="flex items-center gap-3 rounded-lg border border-gray-200 p-3">
                  {media.type === "IMAGE" ? (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img src={media.url} alt="Mídia" className="h-12 w-12 flex-shrink-0 rounded object-cover" />
                  ) : (
                    <span className="text-2xl">{media.type === "VIDEO" ? "🎬" : "🎵"}</span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900">{media.type === "VIDEO" ? "Vídeo" : media.type === "AUDIO" ? "Áudio" : "Imagem"}</p>
                    <a href={media.url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-brand-600 hover:underline">ver arquivo</a>
                  </div>
                  {media.type === "IMAGE" && <Button type="button" variant="ghost" size="sm" disabled={mediaBusy} onClick={() => handleSetAvatar(media.url)}>Foto de perfil</Button>}
                  <Button type="button" variant="ghost" size="sm" disabled={mediaBusy} onClick={() => handleMediaDelete(media.id)}>Remover</Button>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader><h2 className="font-semibold text-gray-900">Preço e área de atendimento</h2></CardHeader>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="Preço mínimo (R$)" type="number" min="0" step="0.01" value={priceMin} onChange={(event) => setPriceMin(event.target.value)} placeholder="500" /><Input label="Preço máximo (R$)" type="number" min="0" step="0.01" value={priceMax} onChange={(event) => setPriceMax(event.target.value)} placeholder="2000" /></div>
            <Input label="Raio de atendimento (km)" type="number" min="1" max="500" value={radius} onChange={(event) => setRadius(event.target.value)} placeholder="50" required />
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><Input label="Latitude" type="number" step="any" value={lat} onChange={(event) => setLat(event.target.value)} placeholder="-23.5505" /><Input label="Longitude" type="number" step="any" value={lng} onChange={(event) => setLng(event.target.value)} placeholder="-46.6333" /></div>
            <Button type="button" variant="secondary" loading={locating} onClick={handleUseMyLocation}>📍 Usar minha localização</Button>
          </CardBody>
        </Card>

        <div className="flex gap-3"><Button type="submit" loading={saving} size="lg" className="flex-1">Salvar perfil</Button><Button type="button" variant="ghost" size="lg" onClick={() => window.history.back()}>Cancelar</Button></div>
      </form>
    </div>
  );
}