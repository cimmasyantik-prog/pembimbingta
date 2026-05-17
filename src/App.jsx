import React, { useState, useEffect, useRef } from 'react';
import { GraduationCap, LogOut, CheckCircle, Lock, BookOpen, Send, User, UploadCloud, MessageSquare, AlertCircle, Bot, Info, FileText, ChevronDown, Sparkles, Image as ImageIcon, Trash2 } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

// ============================================================
// KREDENSIAL DIAMBIL DARI FILE .env
// ============================================================
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;
const NVIDIA_API_KEY = import.meta.env.VITE_NVIDIA_API_KEY; 
// ============================================================

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SKRIPSI_STEPS = [
  { id: 1, name: 'Pengajuan Judul', icon: <BookOpen className="w-5 h-5" /> },
  { id: 2, name: 'Bab 1 (Pendahuluan)', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 3, name: 'Bab 2 (Tinjauan Pustaka)', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 4, name: 'Bab 3 (Metodologi)', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 5, name: 'Seminar Proposal', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 6, name: 'Bab 4 (Hasil & Pembahasan)', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 7, name: 'Bab 5 (Kesimpulan)', icon: <CheckCircle className="w-5 h-5" /> },
  { id: 8, name: 'Sidang Skripsi', icon: <GraduationCap className="w-5 h-5" /> },
];

const AI_MESSAGES = [
  "Sedikit lagi selesai! Ayo semangat revisi Bab 4 nya, jangan lupa jaga kesehatan.",
  "Setiap ketikan di skripsimu adalah langkah maju menuju gelar sarjana. Teruslah berjuang!",
  "Gagal run program itu biasa, yang luar biasa adalah kesabaranmu mencarinya. Semangat!",
  "Jangan takut bimbingan, Pembimbingta' hanya ingin skripsimu menjadi yang terbaik.",
  "Ingat, skripsi yang baik adalah skripsi yang selesai. Yuk selesaikan hari ini!",
  "Malam ini jangan lupa cicil daftar pustaka, biar besok lebih ringan. Kamu pasti bisa!"
];

// ─── KOMPONEN TOMBOL DINAMIS (BISA DIGESER) ────────────────────────────────
const DraggableFAB = ({ onClick, icon, unreadCount, bgColor = "bg-blue-600", hoverColor = "hover:bg-blue-700" }) => {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const dragRef = useRef({ isDragging: false, startX: 0, startY: 0, initialX: 0, initialY: 0, dragged: false });

  const handlePointerDown = (e) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragRef.current.isDragging = true;
    dragRef.current.dragged = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startY = e.clientY;
    dragRef.current.initialX = pos.x;
    dragRef.current.initialY = pos.y;
  };

  const handlePointerMove = (e) => {
    if (!dragRef.current.isDragging) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    
    // Jika digeser lebih dari 5 pixel, tandai sebagai 'drag' bukan 'klik'
    if (Math.abs(dx) > 5 || Math.abs(dy) > 5) {
      dragRef.current.dragged = true;
    }
    
    setPos({
      x: dragRef.current.initialX + dx,
      y: dragRef.current.initialY + dy
    });
  };

  const handlePointerUp = (e) => {
    dragRef.current.isDragging = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleClick = (e) => {
    if (dragRef.current.dragged) {
      e.preventDefault();
      return;
    }
    onClick();
  };

  return (
    <button
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onClick={handleClick}
      style={{ transform: `translate(${pos.x}px, ${pos.y}px)`, touchAction: 'none' }}
      className={`fixed bottom-6 right-6 ${bgColor} text-white p-4 rounded-full shadow-lg transition-colors ${hoverColor} z-40 flex items-center justify-center cursor-grab active:cursor-grabbing`}
    >
      {icon}
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full border-2 border-white animate-bounce">{unreadCount}</span>
      )}
    </button>
  );
};
// ───────────────────────────────────────────────────────────────────────────

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const [view, setView] = useState('role_selection');
  const [selectedRole, setSelectedRole] = useState('');
  const [formData, setFormData] = useState({ name: '', jurusan: '', hp: '', password: '' });
  const [users, setUsers] = useState({});
  const [chats, setChats] = useState({});
  const [currentUser, setCurrentUser] = useState(null);

  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [activeChatUser, setActiveChatUser] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [activeTab, setActiveTab] = useState('chat');
  const [uploadNote, setUploadNote] = useState('');
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadDriveLink, setUploadDriveLink] = useState('');
  const [openStepForms, setOpenStepForms] = useState({});
  const [docError, setDocError] = useState('');
  const chatEndRef = useRef(null);
  const aiChatEndRef = useRef(null);

  const [motivationText, setMotivationText] = useState('');
  const [aiQuery, setAiQuery] = useState('');
  const [aiChatHistory, setAiChatHistory] = useState([]);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const [topicKeyword, setTopicKeyword] = useState('');
  const [generatedTitles, setGeneratedTitles] = useState('');
  const [isGeneratingTitles, setIsGeneratingTitles] = useState(false);
  const [isImprovingNote, setIsImprovingNote] = useState(false);
  const [isDraftingFeedback, setIsDraftingFeedback] = useState(false);

  useEffect(() => {
    const loadInitialData = async () => {
      // Seed akun demo mahasiswa (opsional)
      const { data: existingDemo } = await supabase.from('users').select('id').eq('id', 'arumi').single();
      if (!existingDemo) {
        await supabase.from('users').insert({
          id: 'arumi', name: 'arumi', jurusan: 'Sistem Informasi', hp: '081234567890',
          password: 'arumi', role: 'mahasiswa', unlocked_step_index: 0, status: 'approved'
        });
      }

      await fetchAllData();
      setIsDbReady(true);
    };

    loadInitialData();
    setMotivationText(AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)]);

    const usersSub = supabase.channel('users-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'users' }, fetchAllData).subscribe();
    const messagesSub = supabase.channel('messages-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, fetchAllData).subscribe();
    const docsSub = supabase.channel('documents-channel').on('postgres_changes', { event: '*', schema: 'public', table: 'documents' }, fetchAllData).subscribe();

    return () => {
      supabase.removeChannel(usersSub);
      supabase.removeChannel(messagesSub);
      supabase.removeChannel(docsSub);
    };
  }, []);

  useEffect(() => {
    if (currentUser && currentUser.role === 'mahasiswa' && users[currentUser.id]) {
      setCurrentUser(prev => ({ ...prev, ...users[currentUser.id] }));
    }
  }, [users]);

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    if (aiChatEndRef.current) aiChatEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [chats, activeChatUser, activeTab, aiChatHistory]);

  const fetchAllData = async () => {
    const { data: usersData } = await supabase.from('users').select('*');
    const usersMap = {};
    (usersData || []).forEach(u => { usersMap[u.id] = { ...u, unlockedStepIndex: u.unlocked_step_index }; });
    setUsers(usersMap);

    const { data: messagesData } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
    const { data: docsData } = await supabase.from('documents').select('*').order('created_at', { ascending: true });

    const chatsMap = {};
    (messagesData || []).forEach(msg => {
      if (!chatsMap[msg.chat_id]) chatsMap[msg.chat_id] = { messages: [], docs: [], unreadForMahasiswa: 0, unreadForPembimbing: 0 };
      chatsMap[msg.chat_id].messages.push({ id: msg.id, text: msg.text, senderId: msg.sender_id, timestamp: msg.timestamp, isSystem: msg.is_system });
    });

    (docsData || []).forEach(doc => {
      if (!chatsMap[doc.chat_id]) chatsMap[doc.chat_id] = { messages: [], docs: [], unreadForMahasiswa: 0, unreadForPembimbing: 0 };
      chatsMap[doc.chat_id].docs.push({ id: doc.id, step: doc.step, note: doc.note, fileName: doc.file_name, fileUrl: doc.file_url, driveLink: doc.drive_link, isImage: doc.is_image, timestamp: doc.timestamp });
    });

    await fetchUnreadCounts(chatsMap);
  };

  const fetchUnreadCounts = async (chatsMap) => {
    const { data: metaData } = await supabase.from('chat_meta').select('*');
    (metaData || []).forEach(meta => {
      if (chatsMap[meta.chat_id]) {
        chatsMap[meta.chat_id].unreadForMahasiswa = meta.unread_for_mahasiswa || 0;
        chatsMap[meta.chat_id].unreadForPembimbing = meta.unread_for_pembimbing || 0;
      } else {
        chatsMap[meta.chat_id] = { messages: [], docs: [], unreadForMahasiswa: meta.unread_for_mahasiswa || 0, unreadForPembimbing: meta.unread_for_pembimbing || 0 };
      }
    });
    setChats({ ...chatsMap });
  };

  const upsertChatMeta = async (chatId, unreadM, unreadP) => {
    await supabase.from('chat_meta').upsert({ chat_id: chatId, unread_for_mahasiswa: unreadM, unread_for_pembimbing: unreadP }, { onConflict: 'chat_id' });
  };

  // ─── AI Integrasi Menggunakan NVIDIA API ───────────────────────────────────
  const fetchAiData = async (prompt, history = []) => {
    if (!NVIDIA_API_KEY) return 'API Key NVIDIA belum diatur. Silakan periksa file .env Anda.';

    const systemPrompt = `Anda adalah Asisten AI untuk aplikasi 'Pembimbingta\'. 
    Tugas Anda adalah membantu ${currentUser?.role === 'pembimbing' ? 'Dosen' : 'Mahasiswa'} dalam keluhan skripsi. 
    Balaslah dengan bahasa Indonesia yang sangat sopan, profesional, dan memberikan solusi akademik yang konkret. 
    Ingat konteks percakapan sebelumnya agar bisa 'tek-tokan'.`;

    const formattedHistory = history.map(msg => ({
      role: msg.role === 'model' ? 'assistant' : 'user',
      content: msg.parts[0].text
    }));

    const messages = [
      { role: 'system', content: systemPrompt },
      ...formattedHistory,
      { role: 'user', content: prompt }
    ];

    let retries = 3;
    let delay = 1000;

    while (retries > 0) {
      try {
        const response = await fetch("/proxy-ai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${NVIDIA_API_KEY}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            model: "meta/llama-3.1-8b-instruct", 
            messages: messages,
            temperature: 0.7,
            max_tokens: 1024
          })
        });

        if (!response.ok) {
           const errorDetails = await response.text();
           console.error("Detail Error NVIDIA:", response.status, errorDetails);
           throw new Error(`API Error: ${response.status}`);
        }
        const result = await response.json();
        
        return result.choices?.[0]?.message?.content || 'Maaf, saya tidak bisa memberikan jawaban saat ini.';
        
      } catch (error) {
        console.error("Sistem Gagal Memanggil AI:", error); 
        retries--;
        if (retries === 0) return 'Koneksi ke Asisten AI terputus. Mohon periksa kembali API Key atau koneksi internet Anda.';
        await new Promise(res => setTimeout(res, delay));
        delay *= 2;
      }
    }
  };

  const generateTitles = async () => {
    if (!topicKeyword.trim()) return;
    setIsGeneratingTitles(true);
    const prompt = `Sebagai Asisten Akademik yang ahli, buatkan 3 ide judul skripsi yang spesifik, modern, dan inovatif untuk mahasiswa S1 jurusan "${currentUser.jurusan}" dengan fokus/minat penelitian pada topik: "${topicKeyword}". Berikan langsung daftar ke 3 judulnya dengan poin tanpa kalimat pembuka panjang.`;
    const response = await fetchAiData(prompt);
    setGeneratedTitles(response);
    setIsGeneratingTitles(false);
  };

  const improveNote = async () => {
    if (!uploadNote.trim()) return;
    setIsImprovingNote(true);
    const prompt = `Perbaiki tata bahasa kalimat catatan ini agar menjadi bahasa Indonesia yang formal, sopan, dan akademis yang sangat cocok untuk dikirimkan sebagai catatan revisi skripsi kepada Dosen Pembimbing. Jangan ubah maksud aslinya, jangan tambahkan penjelasan, cukup berikan hasil perbaikan teksnya saja:\n\n"${uploadNote}"`;
    const response = await fetchAiData(prompt);
    setUploadNote(response);
    setIsImprovingNote(false);
  };

  const draftFeedback = async (docStep, docNote) => {
    setIsDraftingFeedback(true);
    setActiveTab('chat');
    const prompt = `Buatkan draft pesan balasan singkat, profesional, dan membangun dari seorang Dosen Pembimbing untuk mahasiswa terkait unggahan dokumen pada tahap "${docStep}". Catatan dari mahasiswa adalah: "${docNote}". Berikan hanya isi pesan draftnya saja, siap dikirim.`;
    const response = await fetchAiData(prompt);
    setMessageInput(response);
    setIsDraftingFeedback(false);
  };

  // ─── Auth ──────────────────────────────────────────────────────────────────
  const handleLogin = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { name, password } = formData;

    if (!name || !password) { setErrorMsg('Nama dan password harus diisi.'); return; }

    const userKey = name.toLowerCase();
    const user = users[userKey];

    if (user && (user.password || '').toLowerCase() === password.toLowerCase()) {
      if (user.role !== selectedRole) {
         setErrorMsg(`Akun ini terdaftar sebagai ${user.role}, bukan ${selectedRole}.`);
         return;
      }
      if (user.status === 'pending') {
        setErrorMsg("Akun Anda sedang menunggu konfirmasi dari Pembimbingta'.");
        return;
      }
      setCurrentUser(user);
      setMotivationText(AI_MESSAGES[Math.floor(Math.random() * AI_MESSAGES.length)]);
      setView('dashboard');
    } else {
      setErrorMsg('Username atau password salah.');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    const { name, jurusan, hp, password } = formData;

    if (!name || !jurusan || !hp || !password) { setErrorMsg('Semua kolom harus diisi.'); return; }

    setIsLoading(true);
    const userKey = name.toLowerCase();

    if (users[userKey]) {
      setErrorMsg('Nama sudah terdaftar. Silakan gunakan nama lain.');
      setIsLoading(false);
      return;
    }

    const { error } = await supabase.from('users').insert({
      id: userKey, name, jurusan, hp, password, role: 'mahasiswa', unlocked_step_index: 0, status: 'pending'
    });

    setIsLoading(false);
    if (error) {
      console.error("Detail Error Supabase:", error); 
      setErrorMsg(`Gagal: ${error.message}`); 
    } else {
      setShowSuccessPopup(true);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('role_selection');
    setSelectedRole('');
    setFormData({ name: '', jurusan: '', hp: '', password: '' });
    setShowLogoutConfirm(false);
    setActiveChatUser(null);
    setAiChatHistory([]);
    setOpenStepForms({});
    setUploadDriveLink('');
    setGeneratedTitles('');
    setTopicKeyword('');
  };

  // ─── Kontrol Admin/Dosen ───────────────────────────────────────────────────
  const approveStudent = async (userId) => { 
    await supabase.from('users').update({ status: 'approved' }).eq('id', userId); 
  };
  
  const rejectStudent = async (userId) => {
    if (window.confirm('Tolak pendaftaran mahasiswa ini? Akun mereka akan dihapus dari sistem.')) {
      await supabase.from('users').delete().eq('id', userId);
    }
  };

  const removeStudent = async (userId) => {
    if (window.confirm('Yakin ingin mengeluarkan mahasiswa ini dari daftar bimbingan? Seluruh akses login mereka akan dicabut.')) {
      await supabase.from('users').delete().eq('id', userId);
    }
  };

  const handleUnlockStep = async (userId, newVal) => { 
    await supabase.from('users').update({ unlocked_step_index: newVal }).eq('id', userId); 
  };

  // ─── Chat & Docs ───────────────────────────────────────────────────────────
  const sendMessage = async (text, senderId, receiverId, isSystem = false) => {
    if (!text.trim()) return;

    const chatId = `chat_${senderId === 'admin' ? receiverId : senderId}`;
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    await supabase.from('messages').insert({ id: Date.now(), chat_id: chatId, text, sender_id: senderId, is_system: isSystem, timestamp });

    const currentChat = chats[chatId] || { unreadForMahasiswa: 0, unreadForPembimbing: 0 };
    const unreadM = senderId === 'admin' ? (currentChat.unreadForMahasiswa || 0) + 1 : currentChat.unreadForMahasiswa || 0;
    const unreadP = senderId !== 'admin' && !isSystem ? (currentChat.unreadForPembimbing || 0) + 1 : currentChat.unreadForPembimbing || 0;
    await upsertChatMeta(chatId, unreadM, unreadP);

    setMessageInput('');
  };

  const clearUnread = async (studentId, role) => {
    const chatId = `chat_${studentId}`;
    const currentChat = chats[chatId] || { unreadForMahasiswa: 0, unreadForPembimbing: 0 };
    const unreadM = role === 'mahasiswa' ? 0 : currentChat.unreadForMahasiswa;
    const unreadP = role === 'pembimbing' ? 0 : currentChat.unreadForPembimbing;
    await upsertChatMeta(chatId, unreadM, unreadP);
  };

  const openChatForStudent = (studentObj) => {
    setActiveChatUser(studentObj);
    setActiveTab('chat');
    clearUnread(studentObj.id, 'pembimbing');
  };

  const toggleStepForm = (index) => {
    setOpenStepForms(prev => ({ ...prev, [index]: !prev[index] }));
    setDocError('');
    setUploadFile(null);
    setUploadDriveLink('');
  };

  const handleUploadDoc = async (stepName, index) => {
    if (!uploadFile && !uploadDriveLink.trim()) {
      setDocError('Mohon pilih file dokumen atau masukkan link Google Drive!');
      return;
    }
    if (!uploadNote.trim()) { 
      setDocError('Mohon sertakan catatan revisi!'); 
      return; 
    }
    if (uploadFile && uploadFile.size > 10 * 1024 * 1024) {
      setDocError('Ukuran file terlalu besar! (Maksimal 10 MB). Silakan gunakan link Google Drive.');
      return;
    }
    setDocError('Sedang mengunggah dan menyimpan data, mohon tunggu...');

    let uploadedFileUrl = null;
    let fileNameUrl = null;
    let isImageFile = false;

    try {
      if (uploadFile) {
        const cleanFileName = uploadFile.name.replace(/[^a-zA-Z0-9.]/g, "_");
        const filePath = `documents/${Date.now()}_${cleanFileName}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('documents_bucket')
          .upload(filePath, uploadFile);

        if (storageError) {
          console.error("Gagal Upload Storage:", storageError.message);
          setDocError('Gagal mengunggah file ke server.');
          return;
        }

        const { data: publicUrlData } = supabase.storage
          .from('documents_bucket')
          .getPublicUrl(filePath);

        fileNameUrl = cleanFileName;
        uploadedFileUrl = publicUrlData?.publicUrl;
        isImageFile = uploadFile.type ? uploadFile.type.startsWith('image/') : false;
      }

      const currentUserId = currentUser?.id || 'anonymous';
      const chatId = `chat_${currentUserId}`;
      const timestampISO = new Date().toISOString();

      const { data: dbData, error: dbError } = await supabase
        .from('documents')
        .insert({
          chat_id: chatId,
          step: stepName,
          note: uploadNote || "",
          file_name: fileNameUrl,
          file_url: uploadedFileUrl,
          drive_link: uploadDriveLink ? uploadDriveLink.trim() : null,
          is_image: isImageFile,
          timestamp: timestampISO
        })
        .select();

      if (dbError) {
        console.error("Detail Error Database:", dbError.message);
        setDocError(`Gagal simpan data ke database: ${dbError.message}`);
        return;
      }

      const infoSumber = fileNameUrl ? `file: ${fileNameUrl}` : `Link Google Drive`;
      await sendMessage(
          `[Sistem] Mahasiswa mengunggah revisi (${infoSumber}) & catatan untuk tahap: ${stepName}`,
          currentUser.id,
          'admin',
          true
      );

      setDocError('');
      setUploadFile(null);
      setUploadDriveLink('');
      setUploadNote('');
      setOpenStepForms(prev => ({ ...prev, [index]: false }));

    } catch (globalError) {
      console.error("Error tidak terduga:", globalError);
      setDocError('Terjadi kesalahan sistem saat memproses dokumen.');
    }
  }; 

  const handleRequestAccess = (stepName) => {
    sendMessage(`[Sistem] Mahasiswa meminta akses untuk tahap: ${stepName}`, currentUser.id, 'admin', true);
    setActiveChatUser({ id: 'admin', name: 'Pembimbingta' });
    setActiveTab('chat');
  };

  const askAi = async () => {
    if (!aiQuery.trim() || isAiLoading) return;
    const userMessage = aiQuery;
    setAiQuery('');
    setAiChatHistory(prev => [...prev, { role: 'user', parts: [{ text: userMessage }] }]);
    setIsAiLoading(true);
    const response = await fetchAiData(userMessage, aiChatHistory);
    setAiChatHistory(prev => [...prev, { role: 'model', parts: [{ text: response }] }]);
    setIsAiLoading(false);
  };

  // ─── Render helpers ────────────────────────────────────────────────────────
  const renderRoleSelection = () => (
    <div className="flex flex-col items-center max-w-md mx-auto w-full space-y-6 pt-10">
      <div className="text-center mb-8">
        <div className="bg-blue-100 text-blue-600 p-4 rounded-full inline-block mb-4 shadow-sm">
          <GraduationCap className="w-12 h-12" />
        </div>
        <h1 className="text-3xl font-bold text-slate-800">Selamat Datang</h1>
        <p className="text-slate-500 mt-2">Pilih peran Anda untuk masuk ke Pembimbingta'</p>
      </div>
      <div
        onClick={() => { setSelectedRole('mahasiswa'); setView('login'); }}
        className="w-full p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group flex items-center space-x-5"
      >
        <div className="bg-blue-50 text-blue-500 p-3 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors">
          <User className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Mahasiswa</h2>
          <p className="text-sm text-slate-500">Ajukan bimbingan skripsi</p>
        </div>
      </div>
      <div
        onClick={() => { setSelectedRole('pembimbing'); setView('login'); }}
        className="w-full p-5 bg-white border border-slate-200 rounded-2xl cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group flex items-center space-x-5"
      >
        <div className="bg-emerald-50 text-emerald-500 p-3 rounded-xl group-hover:bg-emerald-500 group-hover:text-white transition-colors">
          <BookOpen className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Pembimbingta'</h2>
          <p className="text-sm text-slate-500">Masuk untuk memantau mahasiswa</p>
        </div>
      </div>
    </div>
  );

  const renderForm = () => {
    const isMahasiswa = selectedRole === 'mahasiswa';
    const isLogin = view === 'login';
    return (
      <div className="max-w-md w-full mx-auto bg-white p-8 rounded-2xl shadow-sm border border-slate-100 mt-10">
        <button onClick={() => { setView('role_selection'); setErrorMsg(''); }} className="text-sm text-slate-500 hover:text-slate-800 mb-6 flex items-center">← Kembali</button>
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          {isMahasiswa ? (isLogin ? 'Masuk Mahasiswa' : 'Daftar Bimbingan') : 'Masuk Pembimbingta\''}
        </h2>
        <p className="text-slate-500 text-sm mb-6">
          {isMahasiswa && !isLogin ? 'Lengkapi data diri Anda di bawah ini.' : 'Masukkan username dan password Anda.'}
        </p>
        {errorMsg && <div className="p-3 bg-red-50 text-red-600 text-sm rounded-lg mb-4 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> {errorMsg}</div>}
        <form onSubmit={isLogin ? handleLogin : handleRegister} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Nama Lengkap / Username</label>
            <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder={isMahasiswa ? 'Contoh: Budi Susanto' : 'Username dosen (cth: admin)'} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
          </div>
          {!isLogin && isMahasiswa && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Jurusan</label>
                <input type="text" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Contoh: Sistem Informasi" value={formData.jurusan} onChange={e => setFormData({ ...formData, jurusan: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor HP / WA</label>
                <input type="tel" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="0812..." value={formData.hp} onChange={e => setFormData({ ...formData, hp: e.target.value })} />
              </div>
            </>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" className="w-full p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Masukkan password" value={formData.password} onChange={e => setFormData({ ...formData, password: e.target.value })} />
          </div>
          <button type="submit" disabled={isLoading} className={`w-full p-3 rounded-lg font-medium text-white transition-colors flex justify-center items-center ${isLoading ? 'bg-slate-400' : (isMahasiswa ? 'bg-blue-600 hover:bg-blue-700' : 'bg-emerald-600 hover:bg-emerald-700')}`}>
            {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : (isLogin ? 'Masuk' : 'Daftar Sekarang')}
          </button>
        </form>
        {isMahasiswa && (
          <div className="mt-6 text-center text-sm">
            {isLogin
              ? <p className="text-slate-500">Belum punya akun? <span onClick={() => { setView('register'); setErrorMsg(''); }} className="text-blue-600 font-semibold cursor-pointer hover:underline">Daftar di sini</span></p>
              : <p className="text-slate-500">Sudah punya akun? <span onClick={() => { setView('login'); setErrorMsg(''); }} className="text-blue-600 font-semibold cursor-pointer hover:underline">Masuk di sini</span></p>}
          </div>
        )}
      </div>
    );
  };

  const renderStudentDashboard = () => {
    const chatData = chats[`chat_${currentUser.id}`] || {};
    const unreadCount = chatData.unreadForMahasiswa || 0;
    return (
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-slate-800">Profil Mahasiswa</h2>
              <p className="text-slate-500">{currentUser.jurusan}</p>
            </div>
            <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
              Akses Aktif: {SKRIPSI_STEPS[currentUser.unlockedStepIndex]?.name}
            </span>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 relative">
          <h3 className="text-lg font-bold text-slate-800 mb-6">Progres Skripsi</h3>
          <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
            {SKRIPSI_STEPS.map((step, index) => {
              const isUnlocked = index <= currentUser.unlockedStepIndex;
              const isCurrent = index === currentUser.unlockedStepIndex;
              const isFormOpen = openStepForms[index];
              return (
                <div key={step.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className={`flex items-center justify-center w-10 h-10 rounded-full border-4 border-white shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10 ${isUnlocked ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                    {isUnlocked ? step.icon : <Lock className="w-4 h-4" />}
                  </div>
                  <div className={`w-[calc(100%-3rem)] md:w-[calc(50%-2.5rem)] p-4 rounded-xl border ${isCurrent ? 'bg-blue-50 border-blue-200' : (isUnlocked ? 'bg-white border-slate-200' : 'bg-slate-50 border-slate-100 opacity-70')}`}>
                    <div className="flex justify-between items-center">
                      <h4 className={`font-semibold ${isUnlocked ? 'text-slate-800 cursor-pointer hover:text-blue-600' : 'text-slate-500'}`} onClick={() => { if (isUnlocked && index > 0) toggleStepForm(index); }}>
                        {step.name}
                      </h4>
                      {!isUnlocked && (
                        <button onClick={() => handleRequestAccess(step.name)} className="text-xs bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-1 rounded">Minta Akses</button>
                      )}
                    </div>
                    {isUnlocked && index === 0 && (
                      <div className="mt-3 bg-indigo-50 border border-indigo-100 p-4 rounded-xl">
                        <h5 className="text-xs font-bold text-indigo-800 mb-2 flex items-center"><Sparkles className="w-3 h-3 mr-1" /> Bingung Cari Judul Skripsi?</h5>
                        <p className="text-[10px] text-indigo-600 mb-3">Gunakan AI untuk menghasilkan ide judul skripsi berdasarkan jurusanmu.</p>
                        <div className="flex space-x-2">
                          <input type="text" placeholder="Topik (misal: E-commerce, Keuangan, AI)" className="text-xs flex-1 p-2 rounded outline-none border focus:border-indigo-300" value={topicKeyword} onChange={e => setTopicKeyword(e.target.value)} />
                          <button onClick={generateTitles} disabled={isGeneratingTitles || !topicKeyword.trim()} className="bg-indigo-600 text-white text-[10px] font-bold px-3 py-2 rounded hover:bg-indigo-700 disabled:opacity-50 flex items-center shadow-sm transition-colors">
                            {isGeneratingTitles ? 'Meracik Ide...' : '✨ Hasilkan Ide'}
                          </button>
                        </div>
                        {generatedTitles && (
                          <div className="mt-3 p-3 bg-white rounded border border-indigo-100 text-xs text-slate-700 whitespace-pre-wrap leading-relaxed shadow-inner">{generatedTitles}</div>
                        )}
                        <div className="mt-4 border-t border-indigo-100 pt-3">
                          <p className="text-xs text-blue-600 bg-blue-100 p-2 rounded mt-2">
                            <Info className="w-3 h-3 inline mr-1" /> Jika sudah ada ide, gunakan chat untuk ajukan judul ke dosen!
                          </p>
                        </div>
                      </div>
                    )}
                    {isUnlocked && index > 0 && !isFormOpen && (
                      <p className="text-xs text-slate-500 mt-1">Klik judul bab untuk unggah dokumen & revisi.</p>
                    )}
                    {isUnlocked && index > 0 && isFormOpen && (
                      <div className="mt-3 pt-3 border-t border-slate-200 animate-in slide-in-from-top-2">
                        {docError && <p className={`text-xs mb-2 font-medium ${docError.includes('Sedang') ? 'text-blue-600' : 'text-red-500'}`}>{docError}</p>}
                        <div className="flex flex-col space-y-3">
                          <div>
                            <p className="text-[10px] text-slate-500 mb-1 font-medium">*Maksimal file 10 MB (PDF, Word, Gambar).</p>
                            <input type="file" onChange={e => setUploadFile(e.target.files[0])} className="w-full text-xs text-slate-600 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer border border-slate-200 rounded-lg p-1 mb-2 bg-slate-50" />
                            <input type="url" placeholder="Atau tempelkan (paste) link Google Drive skripsi Anda di sini..." className="w-full text-xs p-2.5 border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 mb-1 bg-white" value={uploadDriveLink} onChange={e => setUploadDriveLink(e.target.value)} />
                          </div>
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[10px] text-slate-500 font-medium">Catatan Revisi:</span>
                              <button type="button" onClick={improveNote} disabled={isImprovingNote || !uploadNote.trim()} className="text-[10px] text-indigo-600 font-bold hover:text-indigo-800 disabled:opacity-50 flex items-center transition-colors">
                                <Sparkles className="w-3 h-3 mr-1" /> {isImprovingNote ? 'Memproses...' : '✨ Rapihkan Bahasa'}
                              </button>
                            </div>
                            <textarea placeholder="Tuliskan catatan revisi/perbaikan yang telah Anda lakukan..." className="text-sm p-3 border border-slate-200 rounded-lg w-full h-24 outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400" value={uploadNote} onChange={e => setUploadNote(e.target.value)} />
                          </div>
                          <button onClick={() => handleUploadDoc(step.name, index)} className="bg-blue-600 text-white text-xs py-2.5 rounded-lg font-bold hover:bg-blue-700 flex justify-center items-center shadow-sm">
                            <UploadCloud className="w-4 h-4 mr-2" /> Unggah & Kirim
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* TOMBOL CHAT MAHASISWA YANG BISA DIGESER */}
        <DraggableFAB 
          onClick={() => { setActiveChatUser({ id: 'admin', name: 'Pembimbingta' }); setActiveTab('chat'); clearUnread(currentUser.id, 'mahasiswa'); }}
          icon={<MessageSquare className="w-6 h-6" />}
          unreadCount={unreadCount}
          bgColor="bg-blue-600"
          hoverColor="hover:bg-blue-700"
        />
      </div>
    );
  };

  const renderPembimbingDashboard = () => {
    const studentList = Object.values(users).filter(u => u.role === 'mahasiswa');
    const pendingStudents = studentList.filter(u => u.status === 'pending');
    const approvedStudents = studentList.filter(u => u.status === 'approved');
    
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Daftar Mahasiswa Bimbingan</h2>
          <div className="text-sm text-slate-500 bg-white px-3 py-1 rounded-full shadow-sm border border-slate-100">Total: {approvedStudents.length} Mahasiswa</div>
        </div>
        
        {pendingStudents.length > 0 && (
          <div className="mb-8 p-4 bg-orange-50 border border-orange-200 rounded-xl">
            <h3 className="text-orange-800 font-semibold mb-3 flex items-center"><User className="w-4 h-4 mr-2" /> Menunggu Konfirmasi ({pendingStudents.length})</h3>
            <div className="grid gap-3 sm:grid-cols-2">
              {pendingStudents.map(student => (
                <div key={student.id} className="bg-white p-3 rounded-lg shadow-sm flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-slate-800 text-sm">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.jurusan}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button onClick={() => approveStudent(student.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white text-xs px-3 py-1.5 rounded-md transition-colors font-medium">Terima</button>
                    <button onClick={() => rejectStudent(student.id)} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs px-3 py-1.5 rounded-md transition-colors font-medium">Tolak</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {approvedStudents.length === 0 ? (
            <div className="col-span-full text-center py-12 text-slate-500 bg-white rounded-xl border border-dashed border-slate-300">Belum ada mahasiswa yang dikonfirmasi.</div>
          ) : (
            approvedStudents.map(student => {
              const chatData = chats[`chat_${student.id}`] || {};
              const unreadCount = chatData.unreadForPembimbing || 0;
              return (
                <div key={student.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow relative group">
                  {unreadCount > 0 && (
                    <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full animate-pulse border-2 border-white shadow-sm z-10">{unreadCount} Baru</span>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 font-bold text-lg">
                      {student.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="bg-emerald-50 text-emerald-700 text-xs px-2 py-1 rounded font-medium border border-emerald-100">Aktif</div>
                  </div>
                  <h3 className="font-bold text-slate-800 truncate">{student.name}</h3>
                  <p className="text-xs text-slate-500 mb-4">{student.jurusan}</p>
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-1 flex justify-between">
                      <span>Progres:</span>
                      <span className="font-medium text-blue-600">{SKRIPSI_STEPS[student.unlockedStepIndex]?.name}</span>
                    </p>
                    <div className="w-full bg-slate-100 rounded-full h-1.5">
                      <div className="bg-blue-500 h-1.5 rounded-full transition-all duration-500" style={{ width: `${((student.unlockedStepIndex + 1) / SKRIPSI_STEPS.length) * 100}%` }}></div>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <div className="flex-1 relative">
                      <select className="w-full text-xs p-2 border border-slate-200 rounded-lg appearance-none outline-none focus:border-emerald-400 bg-slate-50" value={student.unlockedStepIndex} onChange={e => handleUnlockStep(student.id, parseInt(e.target.value))}>
                        {SKRIPSI_STEPS.map((step, idx) => <option key={step.id} value={idx}>{step.name}</option>)}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-2.5 text-slate-400 pointer-events-none" />
                    </div>
                    <button onClick={() => openChatForStudent(student)} className="bg-slate-800 text-white text-xs px-3 py-2 rounded-lg hover:bg-slate-700 flex items-center justify-center transition-colors">
                      <MessageSquare className="w-4 h-4" />
                    </button>
                    <button onClick={() => removeStudent(student.id)} className="bg-red-50 text-red-600 border border-red-200 text-xs px-3 py-2 rounded-lg hover:bg-red-100 flex items-center justify-center transition-colors" title="Keluarkan Mahasiswa">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* TOMBOL AI DOSEN YANG BISA DIGESER */}
        <DraggableFAB 
          onClick={() => { setActiveChatUser({ id: 'ai_pembimbing', name: 'Asisten AI Akademik' }); setActiveTab('ai'); }}
          icon={<Bot className="w-6 h-6" />}
          unreadCount={0}
          bgColor="bg-emerald-600"
          hoverColor="hover:bg-emerald-700"
        />
      </div>
    );
  };

  const renderChatPanel = () => {
    if (!activeChatUser) return null;
    const isAiChat = activeChatUser.id === 'ai_pembimbing' || activeTab === 'ai';
    const isStudentChat = activeChatUser.id !== 'admin' && activeChatUser.id !== 'ai_pembimbing';
    let currentChat = { messages: [], docs: [] };
    if (!isAiChat) {
      const chatId = `chat_${currentUser.role === 'mahasiswa' ? currentUser.id : activeChatUser.id}`;
      currentChat = chats[chatId] || { messages: [], docs: [] };
    }
    const aiAllowed = currentUser.role === 'pembimbing' || (currentUser.role === 'mahasiswa' && currentUser.unlockedStepIndex >= 3);
    return (
      <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center z-50 p-4 animate-in fade-in">
        <div className={`bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col ${currentUser.role === 'pembimbing' ? 'h-[85vh]' : 'h-[65vh] sm:h-[500px]'}`}>
          <div className="bg-slate-800 text-white p-4 flex justify-between items-center shrink-0">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                {isAiChat ? <Bot className="w-5 h-5 text-white" /> : <User className="w-5 h-5 text-white" />}
              </div>
              <div>
                <h3 className="font-semibold">{isAiChat ? (currentUser.role === 'pembimbing' ? 'Asisten AI Akademik' : "Asisten Pembimbingta'") : activeChatUser.name}</h3>
                <p className="text-xs text-slate-300">{isAiChat ? 'Bicara Langsung dengan AI' : (currentUser.role === 'pembimbing' ? activeChatUser.jurusan : 'Pembimbing Utama')}</p>
              </div>
            </div>
            <button onClick={() => { setActiveChatUser(null); setActiveTab('chat'); }} className="text-slate-300 hover:text-white p-2">Tutup ✕</button>
          </div>

          {!isAiChat && (
            <div className="flex border-b border-slate-200 shrink-0">
              <button className={`flex-1 py-3 text-sm font-medium flex justify-center items-center ${activeTab === 'chat' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`} onClick={() => { setActiveTab('chat'); if (currentUser.role === 'pembimbing') clearUnread(activeChatUser.id, 'pembimbing'); else clearUnread(currentUser.id, 'mahasiswa'); }}>
                <MessageSquare className="w-4 h-4 mr-2" /> Diskusi
              </button>
              <button className={`flex-1 py-3 text-sm font-medium flex justify-center items-center ${activeTab === 'docs' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-slate-500'}`} onClick={() => setActiveTab('docs')}>
                <FileText className="w-4 h-4 mr-2" /> Dokumen & Revisi
              </button>
              {aiAllowed && (
                <button className={`flex-1 py-3 text-sm font-medium flex justify-center items-center ${activeTab === 'ai' ? 'border-b-2 border-emerald-600 text-emerald-600' : 'text-slate-500'}`} onClick={() => setActiveTab('ai')}>
                  <Sparkles className="w-4 h-4 mr-2" /> Asisten AI
                </button>
              )}
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
            {activeTab === 'chat' && !isAiChat && (
              <div className="space-y-4">
                {currentChat.messages.length === 0
                  ? <div className="text-center text-slate-400 mt-10">Belum ada pesan. Mulai bimbingan sekarang!</div>
                  : currentChat.messages.map(msg => (
                    <div key={msg.id} className={`flex flex-col ${msg.isSystem ? 'items-center' : (msg.senderId === currentUser.id ? 'items-end' : 'items-start')}`}>
                      {msg.isSystem
                        ? <div className="bg-yellow-100 text-yellow-800 text-[10px] px-3 py-1 rounded-full my-2 flex items-center shadow-sm"><Info className="w-3 h-3 mr-1" /> {msg.text}</div>
                        : <div className={`max-w-[85%] rounded-2xl px-4 py-2 break-words shadow-sm ${msg.senderId === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'}`}>
                          <p className="text-sm">{msg.text}</p>
                          <span className={`text-[9px] mt-1 block ${msg.senderId === currentUser.id ? 'text-blue-200' : 'text-slate-400'}`}>{msg.timestamp}</span>
                        </div>}
                    </div>
                  ))}
                <div ref={chatEndRef} />
              </div>
            )}

            {activeTab === 'docs' && !isAiChat && (
              <div className="space-y-4">
                {(!currentChat.docs || currentChat.docs.length === 0)
                  ? <div className="text-center text-slate-400 mt-10">Belum ada dokumen yang diunggah.</div>
                  : currentChat.docs.map(docItem => (
                    <div key={docItem.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-start space-x-4">
                      <div className="bg-blue-50 text-blue-600 p-3 rounded-lg shrink-0">
                        {docItem.isImage ? <ImageIcon className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                      </div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-800 text-sm">{docItem.step}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{docItem.timestamp}</p>
                        <div className="flex flex-wrap items-center mt-2 gap-2">
                          {docItem.fileName && (
                            docItem.fileUrl
                              ? <a href={docItem.fileUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded border border-emerald-200 transition-colors shadow-sm cursor-pointer">
                                {docItem.isImage ? <ImageIcon className="w-3 h-3 mr-1.5" /> : <FileText className="w-3 h-3 mr-1.5" />} {docItem.fileName} (Buka File)
                              </a>
                              : <div className="inline-flex items-center text-[11px] font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded border border-slate-200"><FileText className="w-3 h-3 mr-1.5" /> {docItem.fileName}</div>
                          )}
                          {docItem.driveLink && (
                            <a href={docItem.driveLink} target="_blank" rel="noopener noreferrer" className="inline-flex items-center text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded border border-blue-200 transition-colors shadow-sm cursor-pointer">
                              <Sparkles className="w-3 h-3 mr-1.5 text-blue-500 animate-pulse" /> Buka Link Drive
                            </a>
                          )}
                        </div>
                        <div className="mt-2 bg-slate-50 p-2.5 rounded text-xs text-slate-700 border border-slate-100">
                          <span className="font-bold text-slate-500 block mb-1">Catatan Mahasiswa:</span>
                          {docItem.note}
                        </div>
                        {currentUser.role === 'pembimbing' && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            <button onClick={() => { setActiveTab('chat'); setMessageInput(`Mengenai unggahan di ${docItem.step}: `); }} className="text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded font-bold hover:bg-slate-200 transition-colors">Balas Manual</button>
                            <button onClick={() => draftFeedback(docItem.step, docItem.note)} disabled={isDraftingFeedback} className="text-xs bg-indigo-50 text-indigo-700 border border-indigo-200 px-3 py-1.5 rounded font-bold hover:bg-indigo-100 flex items-center transition-colors disabled:opacity-50">
                              <Sparkles className="w-3 h-3 mr-1" /> {isDraftingFeedback ? 'Membuat...' : 'Buatkan Draft Balasan'}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}

            {(activeTab === 'ai' || isAiChat) && (
              <div className="space-y-4 pb-10">
                <div className="flex flex-col items-start">
                  <div className="bg-emerald-600 text-white rounded-2xl rounded-tl-none px-4 py-3 max-w-[90%] shadow-md text-sm flex items-start space-x-3">
                    <Sparkles className="w-5 h-5 shrink-0 animate-pulse" />
                    <div>
                      <p className="font-bold mb-1">Asisten AI Cerdas</p>
                      <p className="opacity-90 leading-relaxed text-xs">
                        {currentUser.role === 'pembimbing'
                          ? "Halo Bapak/Ibu Dosen. Saya siap membantu menganalisis kendala mahasiswa ini. Ingin 'tek-tokan' soal revisi atau metode mereka?"
                          : "Halo! Saya asisten Pembimbingta'. Kita bisa mengobrol lebih dalam soal skripsimu sekarang. Tanyakan apa saja!"}
                      </p>
                    </div>
                  </div>
                </div>
                {aiChatHistory.map((chat, idx) => (
                  <div key={idx} className={`flex flex-col ${chat.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div className={`px-4 py-2 rounded-2xl text-sm shadow-sm max-w-[90%] ${chat.role === 'user' ? 'bg-emerald-100 text-emerald-800 rounded-tr-none' : 'bg-white border border-slate-200 text-slate-700 rounded-tl-none'}`}>
                      {chat.parts[0].text}
                    </div>
                  </div>
                ))}
                {isAiLoading && (
                  <div className="flex items-center space-x-2 text-emerald-600 text-xs font-medium bg-emerald-50 p-3 rounded-xl w-fit">
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-emerald-600 rounded-full animate-bounce delay-150"></div>
                    <span>Sedang mengetik...</span>
                  </div>
                )}
                <div ref={aiChatEndRef} />
              </div>
            )}
          </div>

          {(activeTab === 'chat' || activeTab === 'ai' || isAiChat) && (
            <div className="p-4 bg-white border-t border-slate-200 shrink-0">
              <form
                onSubmit={e => {
                  e.preventDefault();
                  if (activeTab === 'ai' || isAiChat) askAi();
                  else sendMessage(messageInput, currentUser.id, isStudentChat ? activeChatUser.id : 'admin');
                }}
                className="flex items-center space-x-2"
              >
                <input
                  type="text"
                  value={activeTab === 'ai' || isAiChat ? aiQuery : messageInput}
                  onChange={e => (activeTab === 'ai' || isAiChat) ? setAiQuery(e.target.value) : setMessageInput(e.target.value)}
                  placeholder={activeTab === 'ai' || isAiChat ? 'Tanya asisten AI...' : 'Tulis pesan...'}
                  className={`flex-1 bg-slate-100 border-transparent focus:bg-white rounded-xl px-4 py-3 text-sm outline-none transition-all shadow-inner ${activeTab === 'ai' || isAiChat ? 'focus:ring-2 focus:ring-emerald-200 focus:border-emerald-400' : 'focus:ring-2 focus:ring-blue-200 focus:border-blue-400'}`}
                />
                <button type="submit" disabled={isAiLoading || ((activeTab === 'ai' || isAiChat) ? !aiQuery.trim() : !messageInput.trim())} className={`p-3 rounded-xl text-white transition-all flex shrink-0 shadow-lg hover:scale-105 active:scale-95 ${(activeTab === 'ai' || isAiChat) ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-blue-600 hover:bg-blue-700'}`}>
                  <Send className="w-5 h-5" />
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (!isDbReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 flex-col space-y-4">
        <GraduationCap className="w-12 h-12 text-blue-600 animate-bounce" />
        <div className="text-slate-500 font-medium animate-pulse">Menghubungkan Database Pembimbingta'...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FE] font-sans" style={{ fontFamily: "'Inter', sans-serif" }}>
      <style dangerouslySetInnerHTML={{ __html: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');` }} />

      {view === 'dashboard' && currentUser && (
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
          <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-slate-800 font-bold text-xl">
              <GraduationCap className={`w-7 h-7 ${currentUser.role === 'pembimbing' ? 'text-emerald-600' : 'text-blue-600'}`} />
              <span>Pembimbing<span className={currentUser.role === 'pembimbing' ? 'text-emerald-600' : 'text-blue-600'}>ta'</span></span>
            </div>
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex items-center space-x-2 text-xs font-bold text-slate-600 bg-slate-100 px-4 py-2 rounded-xl border border-slate-200">
                <User className="w-4 h-4" />
                <span>{currentUser.name.toUpperCase()}</span>
              </div>
              <button onClick={() => setShowLogoutConfirm(true)} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                <LogOut className="w-6 h-6" />
              </button>
            </div>
          </div>
        </header>
      )}

      {view === 'dashboard' && currentUser?.role === 'mahasiswa' && (
        <div className="bg-blue-600 text-white text-[11px] font-bold py-2 overflow-hidden relative shadow-inner border-b border-blue-700">
          <div className="whitespace-nowrap animate-[marquee_12s_linear_infinite] inline-block px-4">
            ✨ {motivationText} ✨ &nbsp;&nbsp;&nbsp; ✨ {motivationText} ✨
          </div>
          <style dangerouslySetInnerHTML={{ __html: `@keyframes marquee { 0% { transform: translateX(100vw); } 100% { transform: translateX(-100%); } }` }} />
        </div>
      )}

      <main className="p-4 md:p-8">
        {view === 'role_selection' && renderRoleSelection()}
        {(view === 'login' || view === 'register') && renderForm()}
        {view === 'dashboard' && currentUser?.role === 'mahasiswa' && renderStudentDashboard()}
        {view === 'dashboard' && currentUser?.role === 'pembimbing' && renderPembimbingDashboard()}
      </main>

      {renderChatPanel()}

      {showSuccessPopup && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100 transform animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-10 h-10" />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">Pendaftaran Berhasil!</h3>
            <p className="text-slate-500 mb-8 text-sm leading-relaxed">Akun Anda sedang menunggu konfirmasi dari Pembimbingta'. Silakan login beberapa saat lagi.</p>
            <button onClick={() => { setShowSuccessPopup(false); setView('login'); }} className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg hover:bg-blue-700 transition-colors">Kembali ke Login</button>
          </div>
        </div>
      )}

      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full text-center border border-slate-100 animate-in zoom-in duration-200">
            <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">Keluar Aplikasi?</h3>
            <p className="text-slate-500 text-sm mb-8 leading-relaxed">Anda harus masuk kembali untuk memantau progres bimbingan skripsi.</p>
            <div className="flex space-x-3">
              <button onClick={() => setShowLogoutConfirm(false)} className="flex-1 py-3.5 rounded-2xl border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-colors">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-3.5 rounded-2xl bg-red-500 text-white font-bold hover:bg-red-600 transition-shadow shadow-md shadow-red-200">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
