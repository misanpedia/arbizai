import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Search, GitBranch, AlertTriangle } from "lucide-react";

interface ChangeUplineDialogProps {
  open: boolean;
  onClose: () => void;
  profile: any;
  profiles: any[];
  onSuccess: (profileId: string, newUplineId: string | null) => void;
}

export function ChangeUplineDialog({ open, onClose, profile, profiles, onSuccess }: ChangeUplineDialogProps) {
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<any | null>(null);

  const currentUpline = profile?.referred_by
    ? profiles.find(p => p.id === profile.referred_by)
    : null;

  const results = search.trim().length >= 2
    ? profiles.filter(p =>
        p.id !== profile?.id &&
        ((p.full_name || "").toLowerCase().includes(search.toLowerCase()) ||
         (p.referral_code || "").toLowerCase().includes(search.toLowerCase()))
      ).slice(0, 10)
    : [];

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    const newUplineId = selected ? selected.id : null;
    const { error } = await supabase
      .from("profiles")
      .update({ referred_by: newUplineId })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Upline berhasil diubah!" });
      onSuccess(profile.id, newUplineId);
      onClose();
    }
    setSaving(false);
  };

  const handleRemoveUpline = async () => {
    if (!profile) return;
    setSaving(true);
    const { error } = await supabase
      .from("profiles")
      .update({ referred_by: null })
      .eq("id", profile.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Upline berhasil dihapus!" });
      onSuccess(profile.id, null);
      onClose();
    }
    setSaving(false);
  };

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GitBranch className="w-4 h-4 text-primary" />
            Ubah Upline
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Current member info */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Member</p>
            <p className="text-sm font-medium text-foreground">{profile?.full_name || "User"}</p>
            <p className="text-xs text-muted-foreground">Code: {profile?.referral_code}</p>
          </div>

          {/* Current upline */}
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">Upline Saat Ini</p>
            {currentUpline ? (
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{currentUpline.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">Code: {currentUpline.referral_code}</p>
                </div>
                <Button size="sm" variant="destructive" onClick={handleRemoveUpline} disabled={saving} className="h-7 text-xs">
                  Hapus Upline
                </Button>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">Tidak ada upline</p>
            )}
          </div>

          {/* Search new upline */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">Cari Upline Baru</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Cari nama atau kode referral..."
                value={search}
                onChange={e => { setSearch(e.target.value); setSelected(null); }}
                className="pl-9"
              />
            </div>

            {results.length > 0 && !selected && (
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-border divide-y divide-border">
                {results.map(p => (
                  <button
                    key={p.id}
                    onClick={() => { setSelected(p); setSearch(p.full_name || p.referral_code); }}
                    className="w-full text-left px-3 py-2 hover:bg-muted/50 transition"
                  >
                    <p className="text-sm text-foreground">{p.full_name || "User"}</p>
                    <p className="text-xs text-muted-foreground">{p.referral_code}</p>
                  </button>
                ))}
              </div>
            )}

            {selected && (
              <div className="mt-2 rounded-lg border border-primary/30 bg-primary/5 p-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-foreground">{selected.full_name || "User"}</p>
                  <p className="text-xs text-muted-foreground">{selected.referral_code}</p>
                </div>
                <span className="text-xs text-primary font-medium">Dipilih ✓</span>
              </div>
            )}
          </div>

          {selected && (
            <div className="flex items-start gap-2 rounded-lg bg-destructive/10 border border-destructive/20 p-3">
              <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-xs text-destructive">
                Mengubah upline akan memindahkan member ini ke bawah jaringan <strong>{selected.full_name}</strong>. Pastikan perubahan ini benar.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>Batal</Button>
          <Button onClick={handleSave} disabled={!selected || saving}>
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
