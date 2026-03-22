import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ShieldCheck, ShieldX, Clock, Eye, Search, X, ExternalLink } from "lucide-react";

const AdminKYC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [kycDocs, setKycDocs] = useState<any[]>([]);
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fetchUsers = async () => {
    let q = supabase.from("profiles").select("*").order("created_at", { ascending: false });
    if (filter !== "all") q = q.eq("kyc_status", filter);
    const { data } = await q;
    if (data) setUsers(data);

    const { data: docs } = await supabase.from("kyc_documents").select("*").order("created_at", { ascending: false });
    if (docs) setKycDocs(docs);
  };

  useEffect(() => { fetchUsers(); }, [filter]);

  const updateKYC = async (userId: string, profileId: string, status: string) => {
    const { error } = await supabase.from("profiles").update({ kyc_status: status }).eq("id", profileId);
    await supabase.from("kyc_documents").update({ status: status === "verified" ? "approved" : status }).eq("user_id", userId).eq("status", "pending");
    if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
    else { toast({ title: `KYC ${status}` }); fetchUsers(); }
  };

  const viewDocument = async (docUrl: string) => {
    const { data } = await supabase.storage.from("kyc-documents").createSignedUrl(docUrl, 300);
    if (data?.signedUrl) {
      setPreviewUrl(data.signedUrl);
      setPreviewOpen(true);
    } else {
      toast({ title: "Error", description: "Could not load document", variant: "destructive" });
    }
  };

  const filtered = users.filter(u => !search || (u.full_name || "").toLowerCase().includes(search.toLowerCase()) || (u.referral_code || "").includes(search));
  const getUserDocs = (userId: string) => kycDocs.filter(d => d.user_id === userId);

  return (
    <AdminLayout title="KYC Verification">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2 items-center">
          {["all", "unverified", "pending", "verified", "rejected"].map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${filter === f ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground hover:text-foreground"}`}>{f}</button>
          ))}
          <div className="relative ml-auto max-w-xs flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
        </div>

        <div className="text-sm text-muted-foreground">{filtered.length} users</div>

        <div className="grid gap-2">
          {filtered.map(u => {
            const docs = getUserDocs(u.user_id);
            return (
              <div key={u.id} className="glass-strong rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${u.kyc_status === "verified" ? "bg-success/10" : u.kyc_status === "rejected" ? "bg-destructive/10" : "bg-warning/10"}`}>
                      {u.kyc_status === "verified" ? <ShieldCheck className="w-4 h-4 text-success" /> : u.kyc_status === "rejected" ? <ShieldX className="w-4 h-4 text-destructive" /> : <Clock className="w-4 h-4 text-warning" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{u.full_name || "User"}</p>
                      <p className="text-[10px] text-muted-foreground">Status: {u.kyc_status} · Ref: {u.referral_code} · Docs: {docs.length}</p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {u.kyc_status !== "verified" && (
                      <Button size="sm" onClick={() => updateKYC(u.user_id, u.id, "verified")} className="h-7 text-xs bg-success/10 text-success hover:bg-success/20">Verify</Button>
                    )}
                    {u.kyc_status !== "rejected" && u.kyc_status !== "verified" && (
                      <Button size="sm" variant="outline" onClick={() => updateKYC(u.user_id, u.id, "rejected")} className="h-7 text-xs border-destructive/30 text-destructive hover:bg-destructive/10">Reject</Button>
                    )}
                    {u.kyc_status === "verified" && (
                      <Button size="sm" variant="outline" onClick={() => updateKYC(u.user_id, u.id, "unverified")} className="h-7 text-xs">Revoke</Button>
                    )}
                  </div>
                </div>
                {docs.length > 0 && (
                  <div className="pl-11 space-y-1">
                    {docs.map(doc => (
                      <div key={doc.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                        <button onClick={() => viewDocument(doc.document_url)} className="flex items-center gap-1.5 hover:text-primary transition cursor-pointer">
                          <Eye className="w-3 h-3" />
                          <span className="capitalize">{doc.document_type.replace("_", " ")}</span>
                        </button>
                        <span>· {doc.status}</span>
                        <span>· {new Date(doc.created_at).toLocaleDateString()}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && <p className="text-muted-foreground text-center py-8">No users found</p>}
        </div>
      </div>

      {/* Document Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>Document Preview</span>
              {previewUrl && (
                <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-primary flex items-center gap-1 font-normal">
                  Open full size <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </DialogTitle>
          </DialogHeader>
          {previewUrl && (
            <div className="flex items-center justify-center overflow-auto max-h-[65vh] rounded-lg bg-muted/30">
              <img src={previewUrl} alt="KYC Document" className="max-w-full max-h-[65vh] object-contain rounded-lg" />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminKYC;
