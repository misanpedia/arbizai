import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Megaphone, Send, Trash2, Edit2, X } from "lucide-react";
import { motion } from "framer-motion";

const AdminAnnouncements = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [type, setType] = useState("info");
  const [sending, setSending] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);

  const fetchAnnouncements = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .is("user_id", null)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setAnnouncements(data);
  };

  useEffect(() => { fetchAnnouncements(); }, []);

  const handleSubmit = async () => {
    if (!title || !message) return;
    setSending(true);

    if (editId) {
      const { error } = await supabase
        .from("notifications")
        .update({ title, message, type })
        .eq("id", editId);
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else { toast({ title: "✅ Announcement updated!" }); setEditId(null); }
    } else {
      const { error } = await supabase
        .from("notifications")
        .insert({ title, message, type, user_id: null });
      if (error) toast({ title: "Error", description: error.message, variant: "destructive" });
      else toast({ title: "✅ Announcement published!" });
    }

    setTitle(""); setMessage(""); setType("info");
    setSending(false);
    fetchAnnouncements();
  };

  const handleEdit = (a: any) => {
    setEditId(a.id);
    setTitle(a.title);
    setMessage(a.message);
    setType(a.type);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("notifications").delete().eq("id", id);
    toast({ title: "Announcement deleted" });
    fetchAnnouncements();
  };

  const cancelEdit = () => {
    setEditId(null);
    setTitle("");
    setMessage("");
    setType("info");
  };

  return (
    <AdminLayout title="Announcements">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Total Announcements", value: announcements.length, color: "text-primary" },
            { label: "Info", value: announcements.filter(a => a.type === "info").length, color: "text-primary" },
            { label: "Warnings", value: announcements.filter(a => a.type === "warning").length, color: "text-warning" },
          ].map((c, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-strong rounded-xl p-4">
              <p className="text-xs text-muted-foreground">{c.label}</p>
              <p className={`text-lg font-display font-bold ${c.color}`}>{c.value}</p>
            </motion.div>
          ))}
        </div>

        {/* Create/Edit Form */}
        <div className="glass-strong rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-display font-semibold text-foreground flex items-center gap-2">
              <Megaphone className="w-4 h-4 text-primary" />
              {editId ? "Edit Announcement" : "Create Announcement"}
            </h3>
            {editId && (
              <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Title</Label>
              <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" />
            </div>
            <div className="space-y-1">
              <Label>Message</Label>
              <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="Announcement content..." rows={3} />
            </div>
            <div className="flex gap-2">
              {["info", "warning", "success", "error"].map(t => (
                <button key={t} onClick={() => setType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition ${type === t ? "gradient-primary text-primary-foreground" : "glass text-muted-foreground"}`}>
                  {t}
                </button>
              ))}
            </div>
            <Button onClick={handleSubmit} disabled={sending || !title || !message} className="gradient-primary text-primary-foreground">
              <Send className="w-3 h-3 mr-1" />{sending ? "Publishing..." : editId ? "Update Announcement" : "Publish Announcement"}
            </Button>
          </div>
        </div>

        {/* Announcements List */}
        <div className="glass-strong rounded-2xl p-5">
          <h3 className="font-display font-semibold text-foreground mb-4">All Announcements</h3>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Message</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {announcements.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">No announcements</TableCell></TableRow>
                ) : (
                  announcements.map(a => (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs">{new Date(a.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-xs font-medium">{a.title}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{a.message}</TableCell>
                      <TableCell>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium capitalize ${
                          a.type === "warning" ? "bg-warning/15 text-warning" : 
                          a.type === "success" ? "bg-success/15 text-success" : 
                          a.type === "error" ? "bg-destructive/15 text-destructive" : "bg-primary/15 text-primary"
                        }`}>{a.type}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => handleEdit(a)} className="p-1.5 rounded-lg hover:bg-muted/50 text-muted-foreground hover:text-foreground transition">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => handleDelete(a.id)} className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminAnnouncements;
