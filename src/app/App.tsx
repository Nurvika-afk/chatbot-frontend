import { useState, useRef, useEffect, useCallback } from "react";
import { Send, ChevronDown, CheckCheck, Search, Bell, MoreVertical, User, X } from "lucide-react";
import logoSemarang from "@/assets/logo-semarang.png";

const API_URL = import.meta.env.VITE_API_URL ?? "https://chatbot-backend-production-dab0.up.railway.app";

async function fetchBotReply(message: string): Promise<string> {
  const response = await fetch(`${API_URL}/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!response.ok) throw new Error(`Server error: ${response.status}`);
  const data = await response.json();
  return data.reply ?? "Maaf, terjadi kesalahan pada server.";
}

function localFallback(userText: string): string {
  const t = userText.toLowerCase();
  if (t.includes("ktp"))
    return "Untuk membuat KTP, Anda perlu menyiapkan:<br><ul><li>Fotokopi KK (Kartu Keluarga)</li><li>Surat pengantar dari RT/RW</li><li>Pas foto 3×4 (2 lembar)</li><li>Akte kelahiran (jika ada)</li></ul><br><i>📌 Proses pembuatan KTP biasanya memakan waktu 1–14 hari kerja.</i>";
  if (t.includes("akta") || t.includes("lahir"))
    return "Pendaftaran akta kelahiran dapat dilakukan secara online atau langsung ke kantor kami.<br><ul><li>Surat keterangan lahir dari RS/bidan</li><li>KTP kedua orang tua</li><li>Kartu Keluarga asli</li><li>Buku nikah orang tua</li></ul><br><i>📌 Pelayanan tidak dipungut biaya (gratis) ✅</i>";
  if (t.includes("jam") || t.includes("buka") || t.includes("operasional"))
    return "Jam Operasional Kantor Disdukcapil Kota Semarang:<br><ul><li>🕗 Senin – Kamis : 07.30 – 16.00 WIB</li><li>🕗 Jumat : 07.30 – 11.00 WIB</li><li>❌ Sabtu & Minggu : Tutup</li></ul>";
  if (t.includes("lokasi") || t.includes("alamat") || t.includes("kantor"))
    return "📍 <b>Kantor Disdukcapil Kota Semarang</b><br>Jl. Kanguru Raya No.27, Pedurungan, Semarang<br>📞 (024) 6723512<br>🌐 dukcapil.semarangkota.go.id";
  return "Terima kasih atas pertanyaan Anda! Untuk informasi lebih lanjut hubungi kami di:<br>📞 (024) 6723512<br>🌐 dukcapil.semarangkota.go.id<br><br>Apakah ada hal lain yang bisa saya bantu? 😊";
}

interface Message {
  id: number;
  from: "bot" | "user";
  text: string;
  time: string;
  status?: "sent" | "delivered" | "read";
  isError?: boolean;
}
 const getTime = () =>
    new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });

const initialMessages: Message[] = [
  {
    id: 1,
    from: "bot",
    text: "Halo, Saya SemaBot Selamat datang di layanan informasi Dinas Kependudukan dan Pencatatan Sipil Kota Semarang 🙏",
    time: getTime(),
  },
  {
    id: 2,
    from: "bot",
    text: "Saya adalah asisten virtual Disdukcapil Semarang. Saya siap membantu Anda mendapatkan informasi seputar:<br><ul><li>📋 Kartu Tanda Penduduk (KTP)</li><li>📄 Kartu Keluarga (KK)</li><li>👶 Akta Kelahiran</li><li>💍 Akta Perkawinan & Akta Perceraian</li><li>⚰️ Akta Kematian</li><li>🏠 Domisili & Pindah Alamat</li><li>Dan Lain-Lain</li></ul><br>Note : Semua Pelayanan Administrasi Kependudukan GRATIS YAA",
    time: getTime(),
  },
  {
    id: 3,
    from: "bot",
    text: "Ada yang bisa saya bantu hari ini? Silakan ketik pertanyaan Anda 😊",
    time: getTime(),
  },
];

const quickReplies = [
  "Syarat buat KTP",
  "Cara daftar akta lahir",
  "Jam operasional kantor",
  "Lokasi kantor Disdukcapil",
];

// ============================================================
// SURVEY POPUP COMPONENT
// ============================================================
function SurveyPopup({ onContinue }: { onContinue: () => void }) {
  const [showForm, setShowForm] = useState(false);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: "rgba(0,0,0,0.5)" }}
    >
      <div
        className="relative w-[90%] max-w-md rounded-2xl p-6 text-center"
        style={{ background: "white", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
      >
        {/* Tombol tutup */}
        <button
          onClick={onContinue}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-gray-100 transition-colors"
        >
          <X size={18} className="text-gray-400" />
        </button>

        {!showForm ? (
          <>
            {/* Ikon */}
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "linear-gradient(135deg, #b91c1c, #7f1d1d)" }}>
              <span className="text-2xl">📋</span>
            </div>

            <h3 className="font-bold text-gray-800 text-lg mb-2">
              Apakah Anda ingin melanjutkan percakapan?
            </h3>
            <p className="text-gray-500 text-sm mb-6">
              Jika tidak, silakan isi survei kepuasan pengguna berikut.
            </p>

            <div className="flex gap-3">
              <button
                onClick={onContinue}
                className="flex-1 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
                style={{ background: "linear-gradient(135deg, #b91c1c, #7f1d1d)" }}
              >
                Lanjut Chat
              </button>
              <button
                onClick={() => setShowForm(true)}
                className="flex-1 py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
                style={{ background: "#ef4444" }}
              >
                Isi Survei
              </button>
            </div>
          </> 
        ) : (
          <>
            <h3 className="font-bold text-gray-800 text-base mb-3">
              Survei Kepuasan Pengguna
            </h3>
            <iframe
              src="https://docs.google.com/forms/d/e/1FAIpQLScVNwE8e9T8YGgPuqI024Y3Lg2TgfCxsAC-m3JoaLoqHR7Yiw/viewform?embedded=true"
              width="100%"
              height="420"
              frameBorder={0}
              title="Survei Kepuasan"
            >
              Loading…
            </iframe>
            <button
              onClick={onContinue}
              className="mt-3 w-full py-2.5 rounded-xl font-medium text-white transition-all hover:opacity-90"
              style={{ background: "linear-gradient(135deg, #b91c1c, #7f1d1d)" }}
            >
              Kembali ke Chat
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ============================================================
// AVATAR & INDICATOR COMPONENTS
// ============================================================
function DisdukcapilLogo({ size = 56 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M50 5 L90 20 L90 55 C90 75 70 92 50 98 C30 92 10 75 10 55 L10 20 Z" fill="url(#shieldGrad)" stroke="#fff" strokeWidth="2" />
      <path d="M50 14 L82 26 L82 55 C82 71 65 85 50 90 C35 85 18 71 18 55 L18 26 Z" fill="url(#innerGrad)" />
      <path d="M50 30 L53 40 L63 40 L55 46 L58 56 L50 50 L42 56 L45 46 L37 40 L47 40 Z" fill="#fbbf24" stroke="#f59e0b" strokeWidth="0.5" />
      <rect x="18" y="58" width="64" height="10" rx="2" fill="rgba(255,255,255,0.25)" />
      <text x="50" y="66" textAnchor="middle" fontSize="6" fill="white" fontFamily="sans-serif" fontWeight="700" letterSpacing="1">SEMARANG</text>
      <circle cx="35" cy="78" r="3" fill="#fbbf24" />
      <circle cx="50" cy="80" r="3" fill="#fbbf24" />
      <circle cx="65" cy="78" r="3" fill="#fbbf24" />
      <defs>
        <linearGradient id="shieldGrad" x1="10" y1="5" x2="90" y2="98" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </linearGradient>
        <linearGradient id="innerGrad" x1="18" y1="14" x2="82" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#ef4444" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#991b1b" stopOpacity="0.2" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BotAvatar({ size = 36 }: { size?: number }) {
  return (
    <div className="rounded-full flex items-center justify-center shrink-0 shadow-sm" style={{ width: size, height: size, background: "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)", border: "2px solid rgba(255,255,255,0.5)" }}>
      <svg width={size * 0.55} height={size * 0.55} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="8" r="4" fill="white" fillOpacity="0.95" />
        <path d="M4 20c0-4.418 3.582-8 8-8s8 3.582 8 8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeOpacity="0.95" />
      </svg>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 px-4">
      <BotAvatar size={32} />
      <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5" style={{ background: "#ffffff", boxShadow: "0 1px 4px rgba(0,0,0,0.08)" }}>
        {[0, 1, 2].map((i) => (
          <span key={i} className="w-2 h-2 rounded-full bg-red-400 inline-block" style={{ animation: "bounce 1.2s ease-in-out infinite", animationDelay: `${i * 0.2}s` }} />
        ))}
      </div>
    </div>
  );
}

function ChatBubble({ message }: { message: Message }) {
  const isBot = message.from === "bot";

  if (isBot) {
    return (
      <div className="flex items-end gap-2 px-4">
        <BotAvatar size={32} />
        <div className="flex flex-col gap-0.5 max-w-[72%]">
          <div
            className="bot-html px-4 py-2.5 text-[0.875rem] leading-relaxed rounded-2xl rounded-bl-sm text-gray-800"
            style={{
              background: message.isError ? "#fff5f5" : "#ffffff",
              boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
              borderLeft: message.isError ? "3px solid #fca5a5" : undefined,
            }}
            dangerouslySetInnerHTML={{ __html: message.text }}
          />
          <div className="flex items-center gap-1 px-1">
            <span className="text-[0.7rem] text-red-300">{message.time}</span>
          </div>
        </div>
      </div>
    );
  }

  const lines = message.text.split("\n");
  return (
    <div className="flex items-end gap-2 px-4 justify-end">
      <div className="flex flex-col gap-0.5 max-w-[72%] items-end">
        <div className="px-4 py-2.5 text-[0.875rem] leading-relaxed rounded-2xl rounded-br-sm text-white" style={{ background: "linear-gradient(135deg, #dc2626 0%, #991b1b 100%)", boxShadow: "0 2px 8px rgba(185,28,28,0.35)" }}>
          {lines.map((line, i) => (
            <span key={i}>{line}{i < lines.length - 1 && <br />}</span>
          ))}
        </div>
        <div className="flex items-center gap-1 px-1">
          <CheckCheck size={12} className="text-red-300" />
          <span className="text-[0.7rem] text-red-300">{message.time}</span>
        </div>
      </div>
      <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #f97316 0%, #b45309 100%)", boxShadow: "0 1px 4px rgba(0,0,0,0.15)" }}>
        <User size={14} className="text-white" />
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
const INACTIVITY_DELAY = 35000; // 35 detik

export default function App() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showSurvey, setShowSurvey] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const inactivityTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToBottom = () => bottomRef.current?.scrollIntoView({ behavior: "smooth" });

  useEffect(() => { scrollToBottom(); }, [messages, typing]);

  // Cek koneksi backend saat pertama load
  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => setIsOnline(r.ok))
      .catch(() => setIsOnline(false));
  }, []);

  // ── Inactivity timer (35 detik) ──────────────────────────
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    inactivityTimer.current = setTimeout(() => {
      setShowSurvey(true);
    }, INACTIVITY_DELAY);
  }, []);

  // Mulai timer saat komponen mount
  useEffect(() => {
    resetTimer();
    const handleActivity = () => resetTimer();
    document.addEventListener("click", handleActivity);
    document.addEventListener("keypress", handleActivity);
    return () => {
      document.removeEventListener("click", handleActivity);
      document.removeEventListener("keypress", handleActivity);
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    };
  }, [resetTimer]);

  const handleContinueChat = () => {
    setShowSurvey(false);
    resetTimer();
  };

  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

 
  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || typing) return;

    const userMsg: Message = { id: Date.now(), from: "user", text: trimmed, time: getTime(), status: "read" };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setTyping(true);
    resetTimer(); // reset timer setiap ada pesan baru

    try {
      const replyText = await fetchBotReply(trimmed);
      setIsOnline(true);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: replyText, time: getTime() }]);
    } catch (err) {
      console.warn("Backend tidak tersedia, menggunakan fallback lokal.", err);
      setIsOnline(false);
      setMessages((prev) => [...prev, { id: Date.now() + 1, from: "bot", text: localFallback(trimmed), time: getTime() }]);
    } finally {
      setTyping(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <div className="size-full flex items-center justify-center" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif", background: "#f5e0e0" }}>

      {/* ── Survey Popup ── */}
      {showSurvey && <SurveyPopup onContinue={handleContinueChat} />}

  <div className="w-full flex flex-col relative overflow-hidden" 
    style={{ 
      maxWidth: "480px", 
      height: "100%", 
      maxHeight: "860px", 
      background: "#fdf4f4", 
      boxShadow: "0 8px 48px rgba(0,0,0,0.18)", 
      borderRadius: "clamp(0px, calc((100vw - 480px) * 9999), 24px)" 
  }}>
        <style>{`
          @keyframes bounce { 0%, 60%, 100% { transform: translateY(0); } 30% { transform: translateY(-6px); } }
          ::-webkit-scrollbar { width: 4px; }
          ::-webkit-scrollbar-track { background: transparent; }
          ::-webkit-scrollbar-thumb { background: rgba(185,28,28,0.2); border-radius: 99px; }
          textarea { resize: none; }

          .bot-html ol { list-style-type: decimal; padding-left: 20px; margin: 6px 0; }
          .bot-html ul { list-style-type: disc; padding-left: 20px; margin: 6px 0; }
          .bot-html li { margin-bottom: 4px; }
          .bot-html details { margin-top: 8px; border-top: 1px dashed #e5e7eb; padding-top: 6px; }
          .bot-html summary { cursor: pointer; color: #1d4ed8; font-weight: bold; list-style: none; }
          .bot-html summary::-webkit-details-marker { display: none; }
          .bot-html summary::before { content: '▶ '; font-size: 11px; }
          .bot-html details[open] summary::before { content: '▼ '; }
          .bot-html b { font-weight: 700; }
          .bot-html i { font-style: italic; color: #6b7280; }
          .bot-html a { color: #1d4ed8; text-decoration: underline; }
          .bot-html br { display: block; margin: 2px 0; }
        `}</style>

        {/* Header */}
        <header className="flex items-center gap-3 px-4 py-3 shadow-lg z-10" style={{ background: "linear-gradient(135deg, #b91c1c 0%, #7f1d1d 60%, #450a0a 100%)" }}>
          <img
            src={logoSemarang}
            alt="Logo Disdukcapil Kota Semarang"
            className="shrink-0 drop-shadow-md"
            style={{ width: 48, height: 48, objectFit: "contain" }}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-white font-bold text-[0.95rem] leading-tight truncate">SemaBot Disdukcapil</h1>
            <p className="text-red-200 text-[0.72rem] leading-tight truncate mt-0.5">Asisten Virtual Layanan Dukcapil Kota Semarang</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-yellow-400"}`} />
              <span className={`text-[0.68rem] ${isOnline ? "text-green-300" : "text-yellow-300"}`}>
                {isOnline ? "Online — Siap membantu" : "Mode offline — jawaban terbatas"}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"><Search size={18} /></button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"><Bell size={18} /></button>
            <button className="p-2 rounded-full hover:bg-white/10 transition-colors text-white/80 hover:text-white"><MoreVertical size={18} /></button>
          </div>
        </header>

        {/* Date divider */}
        <div className="flex items-center gap-3 px-6 pt-4 pb-1">
          <div className="flex-1 h-px bg-red-100" />
          <span className="text-[0.68rem] px-3 py-0.5 rounded-full font-medium" style={{ background: "rgba(185,28,28,0.1)", color: "#b91c1c" }}>
            Hari ini, {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </span>
          <div className="flex-1 h-px bg-red-100" />
        </div>

        {/* Chat area */}
        <div ref={chatRef} onScroll={handleScroll} className="flex-1 overflow-y-auto py-3 flex flex-col gap-3" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23b91c1c' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}>
          {messages.map((msg) => <ChatBubble key={msg.id} message={msg} />)}
          {typing && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Scroll to bottom */}
        {showScrollBtn && (
          <button onClick={scrollToBottom} className="absolute bottom-32 right-4 w-9 h-9 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 z-20" style={{ background: "linear-gradient(135deg, #dc2626, #7f1d1d)", color: "white" }}>
            <ChevronDown size={18} />
          </button>
        )}

        {/* Quick replies */}
        <div className="px-4 pb-2 flex gap-2 overflow-x-auto">
          {quickReplies.map((q) => (
            <button key={q} onClick={() => sendMessage(q)} disabled={typing} className="shrink-0 text-[0.75rem] px-3 py-1.5 rounded-full font-medium border transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50" style={{ borderColor: "rgba(185,28,28,0.3)", color: "#b91c1c", background: "rgba(185,28,28,0.06)" }}>
              {q}
            </button>
          ))}
        </div>

        {/* Input bar */}
        <div className="px-3 pb-4 pt-2" style={{ background: "rgba(255,255,255,0.9)", borderTop: "1px solid rgba(185,28,28,0.1)" }}>
          <div className="flex items-end gap-2 px-4 py-2 rounded-2xl shadow-sm" style={{ background: "#fff", border: "1.5px solid rgba(185,28,28,0.2)" }}>
            <textarea
              ref={inputRef}
              rows={1}
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
              }}
              onKeyDown={handleKeyDown}
              placeholder="Ketik pesan Anda…"
              className="flex-1 bg-transparent outline-none text-[0.875rem] text-gray-700 placeholder-red-300 leading-relaxed py-1"
              style={{ maxHeight: "120px", overflowY: "auto" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || typing}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
              style={{ background: input.trim() && !typing ? "linear-gradient(135deg, #dc2626 0%, #7f1d1d 100%)" : "#fca5a5" }}
            >
              <Send size={16} className="text-white translate-x-0.5" />
            </button>
          </div>
          <p className="text-center text-[0.65rem] text-red-300 mt-2">
            Layanan Informasi Resmi · Dinas Kependudukan dan Pencatatan Sipil Kota Semarang
          </p>
        </div>
      </div>
    </div>
  );
}
