import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { ShieldCheck, Upload, Clock, CheckCircle, XCircle, FileText, Camera, BarChart3, ArrowDownCircle, TrendingUp, ArrowUpCircle, Users } from "lucide-react";

const bottomNav = [
  { icon: BarChart3, label: "Dashboard", path: "/dashboard" },
  { icon: ArrowDownCircle, label: "Deposit", path: "/deposit" },
  { icon: TrendingUp, label: "AI Bot", path: "/invest" },
  { icon: ArrowUpCircle, label: "Withdraw", path: "/withdraw" },
  { icon: Users, label: "Profile", path: "/profile" },
];

const KYCUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [selectedType, setSelectedType] = useState("id_card");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [profRes, docsRes] = await Promise.all([
        supabase.from("profiles").select("kyc_status").eq("user_id", user.id).single(),
        supabase.from("kyc_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (profRes.data) setProfile(profRes.data);
      if (docsRes.data) setDocuments(docsRes.data);
    };
    fetchData();
  }, [user]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 5MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    const filePath = `${user.id}/${Date.now()}_${file.name}`;
    const { error: uploadError } = await supabase.storage.from("kyc-documents").upload(filePath, file);
    if (uploadError) {
      toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    const { error: dbError } = await supabase.from("kyc_documents").insert({
      user_id: user.id,
      document_type: selectedType,
      document_url: filePath,
      status: "pending",
    });

    if (dbError) {
      toast({ title: "Error", description: dbError.message, variant: "destructive" });
    } else {
      await supabase.from("profiles").update({ kyc_status: "pending" }).eq("user_id", user.id);
      toast({ title: "Document uploaded!", description: "Verification in progress" });
      // Refetch
      const docsRes = await supabase.from("kyc_documents").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (docsRes.data) setDocuments(docsRes.data);
      setProfile((p: any) => ({ ...p, kyc_status: "pending" }));
    }
    setUploading(false);
  };

  const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
    unverified: { icon: XCircle, color: "text-muted-foreground", label: "Unverified" },
    pending: { icon: Clock, color: "text-warning", label: "Pending Review" },
    verified: { icon: CheckCircle, color: "text-success", label: "Verified" },
    rejected: { icon: XCircle, color: "text-destructive", label: "Rejected" },
  };

  const status = statusConfig[profile?.kyc_status || "unverified"];
  const StatusIcon = status.icon;

  const docTypes = [
    { value: "id_card", label: "ID Card / KTP" },
    { value: "passport", label: "Passport" },
    { value: "driving_license", label: "Driving License" },
    { value: "selfie", label: "Selfie with ID" },
  ];

  const location = useLocation();

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="gradient-primary p-6 pb-8 rounded-b-3xl">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-6 h-6 text-primary-foreground" />
          <h1 className="text-xl font-display font-bold text-primary-foreground">KYC Verification</h1>
        </div>
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass rounded-2xl p-4 bg-primary-foreground/10">
          <div className="flex items-center gap-3">
            <StatusIcon className={`w-8 h-8 ${status.color}`} />
            <div>
              <p className="text-primary-foreground/70 text-xs">Verification Status</p>
              <p className="text-primary-foreground font-display font-bold text-lg">{status.label}</p>
            </div>
          </div>
        </motion.div>
      </header>

      <div className="px-4 mt-6 space-y-6">
        {/* Upload Section */}
        {profile?.kyc_status !== "verified" && (
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="glass-strong rounded-2xl p-5 space-y-4">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" /> Upload Document
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {docTypes.map(dt => (
                <button key={dt.value} onClick={() => setSelectedType(dt.value)}
                  className={`p-3 rounded-xl text-xs font-medium transition border ${selectedType === dt.value ? "border-primary bg-primary/10 text-primary" : "border-border/50 text-muted-foreground hover:border-primary/50"}`}>
                  {dt.label}
                </button>
              ))}
            </div>
            <label className="flex flex-col items-center gap-3 p-8 border-2 border-dashed border-border/50 rounded-2xl cursor-pointer hover:border-primary/50 transition">
              <Camera className="w-10 h-10 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{uploading ? "Uploading..." : "Tap to upload photo"}</span>
              <span className="text-[10px] text-muted-foreground">JPG, PNG · Max 5MB</span>
              <input type="file" accept="image/*" onChange={handleUpload} disabled={uploading} className="hidden" />
            </label>
          </motion.div>
        )}

        {/* Documents List */}
        <div className="glass-strong rounded-2xl p-5 space-y-3">
          <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" /> Submitted Documents
          </h3>
          {documents.length === 0 && <p className="text-muted-foreground text-center py-6 text-sm">No documents submitted yet</p>}
          {documents.map((doc, i) => {
            const ds = statusConfig[doc.status] || statusConfig.pending;
            const DsIcon = ds.icon;
            return (
              <motion.div key={doc.id} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between py-3 border-b border-border/30 last:border-0">
                <div className="flex items-center gap-3">
                  <DsIcon className={`w-5 h-5 ${ds.color}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground capitalize">{doc.document_type.replace("_", " ")}</p>
                    <p className="text-[10px] text-muted-foreground">{new Date(doc.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`text-xs font-medium ${ds.color}`}>{ds.label}</span>
              </motion.div>
            );
          })}
        </div>

        {/* Info */}
        <div className="glass rounded-2xl p-4 space-y-2">
          <p className="text-xs font-medium text-foreground">Requirements:</p>
          <ul className="text-[11px] text-muted-foreground space-y-1">
            <li>• Clear photo of valid government-issued ID</li>
            <li>• Selfie holding your ID document</li>
            <li>• All details must be clearly visible</li>
            <li>• Verification usually takes 24-48 hours</li>
          </ul>
        </div>
      </div>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 glass-strong border-t border-border/50 px-2 py-2 flex justify-around md:hidden z-50">
        {bottomNav.map((item, i) => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={i} to={item.path} className={`flex flex-col items-center gap-0.5 transition py-1 px-3 ${isActive ? "text-primary" : "text-muted-foreground hover:text-primary"}`}>
              <item.icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default KYCUpload;
