import {
  Camera,
  CheckCircle2,
  ClipboardCheck,
  FileText,
  LayoutDashboard,
  Loader2,
  Lock,
  LogOut,
  Plus,
  Printer,
  RefreshCcw,
  Save,
  Search,
  Trash2,
  Users,
  UserRound,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { api } from "./api";
import { companyDefaults, defaultAgreement } from "./defaultAgreement";
import { formatDateLong, formatWeekday, splitDate } from "./formatters";

const API_ORIGIN = (
  import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api"
).replace(/\/api$/, "");

function assetUrl(url) {
  if (!url) return "";
  return url.startsWith("http") ? url : `${API_ORIGIN}${url}`;
}

function canvasToBlob(canvas, mimeType, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, mimeType, quality));
}

function blobToDataUrl(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

async function compressCanvasImage(
  sourceCanvas,
  { maxSize = 720, quality = 0.7 } = {},
) {
  const ratio = Math.min(
    1,
    maxSize / Math.max(sourceCanvas.width, sourceCanvas.height),
  );
  const target = document.createElement("canvas");
  target.width = Math.max(1, Math.round(sourceCanvas.width * ratio));
  target.height = Math.max(1, Math.round(sourceCanvas.height * ratio));
  const ctx = target.getContext("2d");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(sourceCanvas, 0, 0, target.width, target.height);

  let blob = await canvasToBlob(target, "image/webp", quality);
  if (!blob || blob.size === 0) {
    blob = await canvasToBlob(target, "image/jpeg", 0.72);
  }
  return blobToDataUrl(blob);
}

const today = () => new Date().toISOString().slice(0, 10);

const jobSectionOptions = [
  "Produksi",
  "Packing",
  "Gudang",
  "Loading",
  "Quality Control",
  "Operator",
  "Kebersihan",
  "Umum",
];

const fieldGroups = [
  {
    title: "Data Pekerja",
    icon: UserRound,
    fields: [
      {
        name: "workerName",
        label: "Nama pekerja",
        placeholder: "Isi nama lengkap pekerja",
      },
      { name: "workerBirthPlace", label: "Tempat lahir" },
      { name: "workerBirthDate", label: "Tanggal lahir", type: "date" },
      { name: "workerAddress", label: "Alamat pekerja", multiline: true },
      { name: "workerKtp", label: "No. KTP" },
      { name: "workerPhone", label: "No. HP" },
    ],
  },
  {
    title: "Pekerjaan",
    icon: Save,
    fields: [
      {
        name: "jobSection",
        label: "Bagian pekerjaan",
        type: "select",
        options: jobSectionOptions,
      },
    ],
  },
];

const statusLabels = {
  not_started: "Belum dimulai",
  captured: "Wajah tersimpan",
  signed: "Tanda tangan tersimpan",
  pending: "Menunggu",
  approved: "Disetujui",
  rejected: "Ditolak",
};

function Field({ field, value, onChange }) {
  const baseClass =
    "w-full rounded-md border border-line bg-white px-3 py-2 text-sm text-ink outline-none transition focus:border-teal focus:ring-2 focus:ring-teal/15";

  return (
    <label className={field.multiline ? "sm:col-span-2" : ""}>
      <span className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {field.label}
      </span>
      {field.type === "select" ? (
        <select
          value={value || ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          className={baseClass}
        >
          <option value="">Pilih bagian pekerjaan</option>
          {field.options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      ) : field.multiline ? (
        <textarea
          rows={3}
          value={value || ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          className={`${baseClass} resize-none`}
        />
      ) : (
        <input
          type={field.type || "text"}
          value={value || ""}
          onChange={(event) => onChange(field.name, event.target.value)}
          placeholder={field.placeholder}
          className={baseClass}
        />
      )}
    </label>
  );
}

function AgreementForm({ form, onChange }) {
  const currentDate = today();
  const dayName = formatWeekday(currentDate);

  return (
    <div className="space-y-4">
      <section className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Data Tetap Surat</h2>
          <span className="rounded-md bg-gold/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
            Terkunci
          </span>
        </div>
        <div className="grid gap-3 text-sm text-slate-600 sm:grid-cols-2">
          <InfoTile label="Hari otomatis" value={dayName || "-"} />
          <InfoTile
            label="Tanggal perjanjian"
            value={formatDateLong(currentDate)}
          />
          <InfoTile label="Tempat dibuat" value="PASURUAN" />
          <InfoTile label="Perusahaan" value={companyDefaults.companyName} />
          <InfoTile
            label="Diwakili oleh"
            value={companyDefaults.companyRepresentative}
          />
        </div>
      </section>

      {fieldGroups.map((group) => {
        const Icon = group.icon;
        return (
          <section
            key={group.title}
            className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-navy/10 text-navy">
                <Icon size={17} />
              </span>
              <h2 className="text-sm font-bold text-ink">{group.title}</h2>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={form[field.name]}
                  onChange={onChange}
                />
              ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-md border border-line bg-slate-50 px-3 py-2">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
        {label}
      </p>
      <div className="mt-1 break-words text-sm font-bold text-ink">{value}</div>
    </div>
  );
}

function SignaturePad({
  form,
  pendingSignature,
  onPendingSignature,
  setStatus,
  readyMessage = "Tanda tangan siap. Tekan Submit untuk menyimpan ke database.",
}) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const point = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const source = event.touches?.[0] || event;
    return {
      x: ((source.clientX - rect.left) / rect.width) * canvas.width,
      y: ((source.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const start = (event) => {
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = point(event);
    ctx.beginPath();
    ctx.moveTo(p.x, p.y);
    setIsDrawing(true);
  };

  const move = (event) => {
    if (!isDrawing) return;
    event.preventDefault();
    const ctx = canvasRef.current.getContext("2d");
    const p = point(event);
    ctx.lineTo(p.x, p.y);
    ctx.strokeStyle = "#162023";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();
  };

  const clear = () => {
    const canvas = canvasRef.current;
    canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height);
    onPendingSignature("");
    setStatus("Tanda tangan dibersihkan.");
  };

  const saveLocal = () => {
    const imageData = canvasRef.current.toDataURL("image/png");
    onPendingSignature(imageData);
    setStatus(readyMessage);
  };

  const displayedSignature =
    pendingSignature || assetUrl(form.signatureImageUrl);

  return (
    <section className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink">Tanda Tangan Digital</h2>
          <p className="text-xs text-slate-500">
            Gambar tanda tangan pekerja pada area berikut.
          </p>
        </div>
        <Status
          value={
            pendingSignature || form.eSignatureStatus === "signed"
              ? "signed"
              : "not_started"
          }
        />
      </div>
      <canvas
        ref={canvasRef}
        width="720"
        height="220"
        className="h-40 w-full touch-none rounded-md border border-dashed border-slate-300 bg-white"
        onMouseDown={start}
        onMouseMove={move}
        onMouseUp={() => setIsDrawing(false)}
        onMouseLeave={() => setIsDrawing(false)}
        onTouchStart={start}
        onTouchMove={move}
        onTouchEnd={() => setIsDrawing(false)}
      />
      <div className="mt-3 flex flex-wrap gap-2">
        <button className="btn-secondary" type="button" onClick={clear}>
          <X size={16} />
          Bersihkan
        </button>
        <button className="btn-primary" type="button" onClick={saveLocal}>
          <Save size={16} />
          Siapkan TTD
        </button>
      </div>
      {displayedSignature && (
        <img
          src={displayedSignature}
          alt="Tanda tangan"
          className="mt-3 h-20 rounded border border-line bg-white object-contain p-2"
        />
      )}
    </section>
  );
}

function FaceCapture({
  form,
  pendingFace,
  onPendingFace,
  setStatus,
  readyMessage = "Foto wajah siap. Tekan Submit untuk menyimpan ke database.",
}) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [consent, setConsent] = useState(false);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user" },
        audio: false,
      });
      streamRef.current = stream;
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setStatus("Kamera aktif. Posisikan wajah di dalam frame.");
    } catch (error) {
      setStatus(`Kamera tidak bisa diakses: ${error.message}`);
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setIsCameraOn(false);
  };

  useEffect(() => stopCamera, []);

  const capture = async () => {
    if (!consent) {
      setStatus("Centang persetujuan penyimpanan data wajah terlebih dahulu.");
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = await compressCanvasImage(canvas, {
      maxSize: 720,
      quality: 0.7,
    });
    onPendingFace({
      imageData,
      consent,
      captureNote: "Captured inside browser face frame",
    });
    setStatus(readyMessage);
  };

  const displayedFace = pendingFace?.imageData || assetUrl(form.faceImageUrl);

  return (
    <section className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-bold text-ink">Verifikasi Wajah</h2>
          <p className="text-xs text-slate-500">
            Ambil foto wajah pekerja dalam frame verifikasi.
          </p>
        </div>
        <Status
          value={pendingFace ? "captured" : form.faceVerificationStatus}
        />
      </div>
      <div className="relative aspect-[4/3] overflow-hidden rounded-md bg-slate-900">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <div className="h-[72%] w-[58%] rounded-[50%] border-4 border-white shadow-[0_0_0_999px_rgba(0,0,0,0.35)]" />
        </div>
        {!isCameraOn && (
          <div className="absolute inset-0 grid place-items-center text-sm font-bold text-white">
            Kamera belum aktif
          </div>
        )}
      </div>
      <canvas ref={canvasRef} className="hidden" />
      <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={consent}
          onChange={(event) => setConsent(event.target.checked)}
        />
        Saya menyetujui penyimpanan foto wajah untuk kebutuhan verifikasi
        perjanjian kerja.
      </label>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className="btn-secondary"
          type="button"
          onClick={isCameraOn ? stopCamera : startCamera}
        >
          <Camera size={16} />
          {isCameraOn ? "Matikan Kamera" : "Aktifkan Kamera"}
        </button>
        <button
          className="btn-primary"
          type="button"
          onClick={capture}
          disabled={!isCameraOn}
        >
          <CheckCircle2 size={16} />
          Siapkan Wajah
        </button>
      </div>
      {displayedFace && (
        <img
          src={displayedFace}
          alt="Wajah"
          className="mt-3 h-28 rounded border border-line object-cover"
        />
      )}
    </section>
  );
}

function Status({ value }) {
  const done = value === "signed" || value === "captured";
  return (
    <span
      className={`rounded-md px-2 py-1 text-xs font-bold ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-600"}`}
    >
      {statusLabels[value] || value || "Belum dimulai"}
    </span>
  );
}

function Fill({ children }) {
  return (
    <span className="border-b border-dotted border-slate-500 px-1 font-semibold text-ink">
      {children || "................"}
    </span>
  );
}

function DocumentPreview({ data, pendingSignature, pendingFace }) {
  const currentDate = data.agreementDate || today();
  const made = splitDate(currentDate);
  const day = formatWeekday(currentDate);

  return (
    <article className="document-page mx-auto min-h-[1120px] w-full max-w-[794px] bg-white px-12 py-12 text-[13px] leading-6 text-slate-900 shadow-panel">
      <h1 className="mb-6 text-center text-base font-bold uppercase underline">
        Surat Perjanjian Kerja Harian Lepas
      </h1>
      <p>
        Pada hari ini <Fill>{day}</Fill> tanggal <Fill>{made.date}</Fill> bulan{" "}
        <Fill>{made.month}</Fill> tahun <Fill>{made.year}</Fill>, bertempat di{" "}
        <Fill>PASURUAN</Fill>, telah dibuat dan disepakati Perjanjian Kerja
        Harian Lepas antara:
      </p>
      <SectionTitle>PIHAK PERTAMA (PERUSAHAAN)</SectionTitle>
      <IdentityRow
        label="Nama Perusahaan"
        value={companyDefaults.companyName}
      />
      <IdentityRow label="Alamat" value={companyDefaults.companyAddress} />
      <IdentityRow
        label="Diwakili oleh"
        value={companyDefaults.companyRepresentative}
      />
      <IdentityRow label="Jabatan" value={companyDefaults.companyPosition} />
      <p className="mt-2">Selanjutnya disebut PIHAK PERTAMA.</p>

      <SectionTitle>PIHAK KEDUA (PEKERJA)</SectionTitle>
      <IdentityRow label="Nama" value={data.workerName} />
      <IdentityRow
        label="Tempat/Tanggal Lahir"
        value={`${data.workerBirthPlace || "................"} / ${formatDateLong(data.workerBirthDate)}`}
      />
      <IdentityRow label="Alamat" value={data.workerAddress} />
      <IdentityRow label="No. KTP" value={data.workerKtp} />
      <IdentityRow label="No. HP" value={data.workerPhone} />
      <p className="mt-2">Selanjutnya disebut PIHAK KEDUA.</p>

      <p className="mt-4">
        Kedua belah pihak sepakat mengikatkan diri dalam Perjanjian Kerja Harian
        Lepas dengan ketentuan sebagai berikut:
      </p>
      <Article number="1" title="Jenis Pekerjaan">
        PIHAK KEDUA bekerja sebagai tenaga kerja harian lepas pada bagian{" "}
        <Fill>{data.jobSection}</Fill> sesuai kebutuhan operasional perusahaan.
      </Article>
      <Article number="2" title="Sistem Kerja dan Upah">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Hubungan kerja ini bersifat Harian Lepas.</li>
          <li>
            PIHAK KEDUA bekerja berdasarkan kebutuhan pekerjaan dari PIHAK
            PERTAMA.
          </li>
          <li>
            Upah kerja diberikan sesuai kesepakatan kedua belah pihak dan
            kebijakan perusahaan.
          </li>
          <li>
            Pembayaran upah dilakukan secara harian sesuai kebijakan perusahaan.
          </li>
          <li>
            PIHAK KEDUA menyetujui adanya potongan administrasi / CV sebesar Rp
            15.000 setiap 1 bulan sekali untuk pengurusan administrasi BPJS
            Ketenagakerjaan program JKK dan JKM.
          </li>
        </ol>
      </Article>
      <Article number="3" title="Jam Kerja dan Lembur">
        PIHAK KEDUA bersedia bekerja dengan sistem 3 shift sesuai kebutuhan
        operasional perusahaan, termasuk kerja lembur apabila dibutuhkan
        perusahaan.
      </Article>
      <Article number="4" title="Kewajiban Pekerja">
        PIHAK KEDUA wajib mematuhi peraturan perusahaan, menjaga ketertiban,
        kedisiplinan, nama baik perusahaan, dan bertanggung jawab atas kelalaian
        pribadi sesuai ketentuan yang berlaku.
      </Article>
      <Article number="5" title="Keselamatan dan Kecelakaan Kerja">
        Apabila terjadi kecelakaan kerja, penanganan dan pembiayaan ditanggung
        melalui BPJS Ketenagakerjaan sesuai syarat dan ketentuan yang berlaku.
      </Article>
      <Article number="6" title="Berakhirnya Hubungan Kerja">
        Hubungan kerja harian lepas ini dapat berakhir sewaktu-waktu sesuai
        kebutuhan operasional perusahaan. Karena bersifat harian lepas, PIHAK
        KEDUA tidak berhak atas pesangon setelah hubungan kerja berakhir.
      </Article>
      <Article number="7" title="Penyelesaian Perselisihan">
        Segala perselisihan diselesaikan terlebih dahulu secara musyawarah
        antara PIHAK PERTAMA dan PIHAK KEDUA, lalu mengikuti ketentuan hukum dan
        peraturan ketenagakerjaan yang berlaku apabila diperlukan.
      </Article>
      <Article number="8" title="Penutup">
        Demikian Surat Perjanjian Kerja Harian Lepas ini dibuat dengan
        sebenar-benarnya dalam keadaan sadar, sehat jasmani dan rohani, tanpa
        paksaan dari pihak manapun, dan disetujui oleh kedua belah pihak.
      </Article>

      <p className="mt-8">Dibuat di Pasuruan, {formatDateLong(currentDate)}</p>
      <div className="mt-10 grid grid-cols-2 gap-8 text-center">
        <div>
          <p className="font-semibold">PIHAK PERTAMA</p>
          <div className="h-20" />
          <p className="font-semibold">
            ({companyDefaults.companyRepresentative})
          </p>
        </div>
        <div>
          <p className="font-semibold">PIHAK KEDUA</p>
          <div className="flex h-20 items-center justify-center">
            {(pendingSignature || data.signatureImageUrl) && (
              <img
                src={pendingSignature || assetUrl(data.signatureImageUrl)}
                alt="Tanda tangan pihak kedua"
                className="max-h-16 object-contain"
              />
            )}
          </div>
          <p className="font-semibold">
            ({data.workerName || "................"})
          </p>
        </div>
      </div>
      {(pendingFace || data.faceImageUrl) && (
        <p className="mt-6 text-center text-[11px] text-slate-600">
          Data wajah pekerja telah disiapkan untuk verifikasi internal.
        </p>
      )}
    </article>
  );
}

function SectionTitle({ children }) {
  return <h2 className="mt-5 text-sm font-bold uppercase">{children}</h2>;
}

function IdentityRow({ label, value }) {
  return (
    <div className="grid grid-cols-[170px_1fr] gap-2">
      <span>{label}</span>
      <span>: {value || "................"}</span>
    </div>
  );
}

function Article({ number, title, children }) {
  return (
    <section className="mt-4">
      <h2 className="text-center font-bold uppercase">Pasal {number}</h2>
      <h3 className="mb-1 text-center font-bold uppercase">{title}</h3>
      <div>{children}</div>
    </section>
  );
}

function PrintPanel({ compact = false }) {
  return (
    <div className={`no-print ${compact ? "" : "mt-4"} flex justify-end`}>
      <button
        className="no-print btn-primary"
        type="button"
        onClick={() => window.print()}
      >
        <Printer size={16} />
        Cetak Surat
      </button>
    </div>
  );
}

function ChangeRequestPage({ setPage, setStatus }) {
  const [form, setForm] = useState({
    workerName: "",
    workerKtp: "",
    workerPhone: "",
    requestedChanges: "",
    reason: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const update = (name, value) =>
    setForm((current) => ({ ...current, [name]: value }));

  const submit = async () => {
    setIsSubmitting(true);
    try {
      await api.createChangeRequest(form);
      setForm({
        workerName: "",
        workerKtp: "",
        workerPhone: "",
        requestedChanges: "",
        reason: "",
      });
      setStatus("Pengajuan perubahan data berhasil dikirim.");
      setPage("form");
      window.location.hash = "";
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-5 py-5">
      <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
        <h2 className="text-lg font-black">Form Pengajuan Perubahan Data</h2>
        <p className="mt-1 text-sm text-slate-500">
          Gunakan form ini jika terdapat salah input pada data perjanjian yang
          sudah dikirim.
        </p>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Field
            field={{ name: "workerName", label: "Nama pekerja" }}
            value={form.workerName}
            onChange={update}
          />
          <Field
            field={{ name: "workerKtp", label: "No. KTP" }}
            value={form.workerKtp}
            onChange={update}
          />
          <Field
            field={{ name: "workerPhone", label: "No. HP" }}
            value={form.workerPhone}
            onChange={update}
          />
          <Field
            field={{
              name: "requestedChanges",
              label: "Data yang ingin diubah",
              multiline: true,
            }}
            value={form.requestedChanges}
            onChange={update}
          />
          <Field
            field={{ name: "reason", label: "Alasan", multiline: true }}
            value={form.reason}
            onChange={update}
          />
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => setPage("form")}
          >
            Kembali
          </button>
          <button
            className="btn-primary"
            type="button"
            onClick={submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <ClipboardCheck size={16} />
            )}
            Kirim Pengajuan
          </button>
        </div>
      </section>
    </main>
  );
}

function AdminLoginPage({ onLogin, setPage, setStatus }) {
  const [credentials, setCredentials] = useState({
    username: "",
    password: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async () => {
    setIsSubmitting(true);
    try {
      const result = await api.loginAdmin(credentials);
      onLogin(result.admin);
      setPage("admin");
      window.history.pushState({}, "", "/admin");
      setStatus("Login admin berhasil.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="mx-auto grid min-h-[70vh] max-w-md place-items-center px-5 py-5">
      <section className="official-panel w-full rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-navy text-white">
            <Lock size={18} />
          </span>
          <div>
            <h2 className="text-lg font-black">Login Admin</h2>
            <p className="text-sm text-slate-500">
              Akses internal CV. KRAINING MULTI ABADI.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <Field
            field={{ name: "username", label: "Username" }}
            value={credentials.username}
            onChange={(name, value) =>
              setCredentials((current) => ({ ...current, [name]: value }))
            }
          />
          <Field
            field={{ name: "password", label: "Password", type: "password" }}
            value={credentials.password}
            onChange={(name, value) =>
              setCredentials((current) => ({ ...current, [name]: value }))
            }
          />
          <button
            className="btn-primary w-full"
            type="button"
            onClick={submit}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={16} />
            ) : (
              <Lock size={16} />
            )}
            Masuk
          </button>
        </div>
      </section>
    </main>
  );
}

function AdminPage({
  adminUser,
  adminTab,
  setAdminTab,
  stats,
  agreements,
  changeRequests,
  search,
  setSearch,
  loadAdminData,
  deleteAgreement,
  reviewChangeRequest,
  logoutAdmin,
  setStatus,
}) {
  const tabs = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "employees", label: "Data Karyawan", icon: Users },
    { id: "archive", label: "Arsip", icon: FileText },
    { id: "changes", label: "Pengajuan Perubahan", icon: ClipboardCheck },
  ];

  return (
    <main className="mx-auto grid max-w-[1500px] gap-5 px-5 py-5 lg:grid-cols-[260px_1fr]">
      <aside className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm">
        <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
          Admin Panel
        </p>
        <h2 className="mt-1 text-base font-black">CV. KRAINING MULTI ABADI</h2>
        <p className="mt-1 text-xs text-slate-500">
          Login sebagai {adminUser?.username}
        </p>
        <div className="mt-5 space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setAdminTab(tab.id)}
                className={`flex h-10 w-full items-center gap-2 rounded-md px-3 text-sm font-bold ${
                  adminTab === tab.id
                    ? "bg-navy text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            );
          })}
        </div>
        <button
          className="btn-secondary mt-5 w-full"
          type="button"
          onClick={logoutAdmin}
        >
          <LogOut size={16} />
          Keluar
        </button>
      </aside>
      <section className="min-w-0">
        {adminTab === "dashboard" && <AdminDashboard stats={stats} />}
        {adminTab === "employees" && <EmployeeData agreements={agreements} />}
        {adminTab === "archive" && (
          <AdminArchivePage
            agreements={agreements}
            search={search}
            setSearch={setSearch}
            loadAgreements={loadAdminData}
            deleteAgreement={deleteAgreement}
            setStatus={setStatus}
          />
        )}
        {adminTab === "changes" && (
          <ChangeRequestsAdmin
            changeRequests={changeRequests}
            reviewChangeRequest={reviewChangeRequest}
          />
        )}
      </section>
    </main>
  );
}

function AdminDashboard({ stats }) {
  const cards = [
    ["Total Perjanjian", stats?.totalAgreements || 0],
    ["TTD Tersimpan", stats?.signedAgreements || 0],
    ["Wajah Tersimpan", stats?.capturedFaces || 0],
    ["Pengajuan Pending", stats?.pendingChangeRequests || 0],
  ];
  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map(([label, value]) => (
        <div
          key={label}
          className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm"
        >
          <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black text-navy">{value}</p>
        </div>
      ))}
    </section>
  );
}

function EmployeeData({ agreements }) {
  return (
    <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Data Karyawan</h2>
      <div className="mt-4 overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line text-xs uppercase tracking-[0.08em] text-slate-500">
            <tr>
              <th className="py-3">Nama</th>
              <th>No. KTP</th>
              <th>No. HP</th>
              <th>Bagian</th>
              <th>Tanggal Perjanjian</th>
            </tr>
          </thead>
          <tbody>
            {agreements.map((item) => (
              <tr key={item.id} className="border-b border-line">
                <td className="py-3 font-bold">{item.workerName}</td>
                <td>{item.workerKtp}</td>
                <td>{item.workerPhone}</td>
                <td>{item.jobSection}</td>
                <td>{formatDateLong(item.agreementDate)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ChangeRequestsAdmin({ changeRequests, reviewChangeRequest }) {
  return (
    <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black">Pengajuan Perubahan</h2>
      <div className="mt-4 space-y-3">
        {changeRequests.map((item) => (
          <div key={item.id} className="rounded-lg border border-line p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="font-bold">{item.workerName}</p>
                <p className="text-sm text-slate-500">
                  KTP {item.workerKtp} - {item.workerPhone}
                </p>
              </div>
              <Status value={item.status} />
            </div>
            <p className="mt-3 text-sm">
              <span className="font-bold">Perubahan:</span>{" "}
              {item.requestedChanges}
            </p>
            {item.reason && (
              <p className="mt-1 text-sm">
                <span className="font-bold">Alasan:</span> {item.reason}
              </p>
            )}
            {item.status === "pending" && (
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className="btn-primary h-9"
                  type="button"
                  onClick={() => reviewChangeRequest(item.id, "approved")}
                >
                  Setujui
                </button>
                <button
                  className="btn-secondary h-9"
                  type="button"
                  onClick={() => reviewChangeRequest(item.id, "rejected")}
                >
                  Tolak
                </button>
              </div>
            )}
          </div>
        ))}
        {!changeRequests.length && (
          <p className="text-sm text-slate-500">
            Belum ada pengajuan perubahan.
          </p>
        )}
      </div>
    </section>
  );
}

function AdminArchivePage({
  agreements,
  search,
  setSearch,
  loadAgreements,
  deleteAgreement,
  setStatus,
}) {
  const [openedAgreement, setOpenedAgreement] = useState(null);

  const submitSearch = (event) => {
    event.preventDefault();
    setOpenedAgreement(null);
    loadAgreements(search);
  };

  if (openedAgreement) {
    return (
      <ArchiveAgreementDetail
        agreement={openedAgreement}
        onBack={() => setOpenedAgreement(null)}
        onDelete={async () => {
          const deleted = await deleteAgreement(openedAgreement.id);
          if (deleted) setOpenedAgreement(null);
        }}
        onSaved={async (updatedAgreement) => {
          setOpenedAgreement(updatedAgreement);
          await loadAgreements(search);
        }}
        setStatus={setStatus}
      />
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-5 py-5">
      <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black">Arsip Perjanjian Admin</h2>
            <p className="text-sm text-slate-500">
              CV. KRAINING MULTI ABADI - Administrasi perjanjian kerja harian
              lepas.
            </p>
          </div>
        </div>
        <form
          onSubmit={submitSearch}
          className="mb-4 flex max-w-md items-center gap-2 rounded-md border border-line px-2"
        >
          <Search size={15} className="text-slate-400" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="h-10 flex-1 text-sm outline-none"
            placeholder="Cari nama, KTP, bagian"
          />
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="py-3">Nama</th>
                <th>Bagian</th>
                <th>Tanggal</th>
                <th>TTD</th>
                <th>Wajah</th>
                <th className="text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((item) => (
                <tr key={item.id} className="border-b border-line">
                  <td className="py-3 font-bold">{item.workerName}</td>
                  <td>{item.jobSection}</td>
                  <td>{formatDateLong(item.agreementDate)}</td>
                  <td>
                    <Status value={item.eSignatureStatus} />
                  </td>
                  <td>
                    <Status value={item.faceVerificationStatus} />
                  </td>
                  <td className="text-right">
                    <button
                      className="btn-secondary mr-2 h-9"
                      type="button"
                      onClick={() => setOpenedAgreement(item)}
                    >
                      Buka
                    </button>
                    <button
                      className="btn-secondary h-9"
                      type="button"
                      onClick={() => deleteAgreement(item.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!agreements.length && (
                <tr>
                  <td colSpan="6" className="py-8 text-center text-slate-500">
                    Belum ada data tersimpan.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

function ArchiveAgreementDetail({
  agreement,
  onBack,
  onDelete,
  onSaved,
  setStatus,
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(() => ({ ...agreement }));
  const [pendingSignature, setPendingSignature] = useState("");
  const [pendingFace, setPendingFace] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setDraft({ ...agreement });
    setPendingSignature("");
    setPendingFace(null);
    setIsEditing(false);
  }, [agreement]);

  const canSave =
    draft.workerName &&
    draft.workerBirthPlace &&
    draft.workerAddress &&
    draft.workerKtp &&
    draft.workerPhone &&
    draft.jobSection;

  const updateDraft = (name, value) => {
    setDraft((current) => ({ ...current, [name]: value }));
  };

  const cancelEdit = () => {
    setDraft({ ...agreement });
    setPendingSignature("");
    setPendingFace(null);
    setIsEditing(false);
    setStatus("");
  };

  const saveEdit = async () => {
    if (!canSave) {
      setStatus("Lengkapi data pekerja dan bagian pekerjaan sebelum menyimpan perubahan.");
      return;
    }

    setIsSaving(true);
    try {
      const agreementDate = draft.agreementDate || agreement.agreementDate || today();
      let saved = await api.updateAgreement(agreement.id, {
        ...draft,
        agreementDate,
        agreementDay: formatWeekday(agreementDate),
        agreementPlace: "PASURUAN",
        ...companyDefaults,
        dailyWage: Number(draft.dailyWage || 0),
        wagePaymentPolicy: "harian",
        signatureCity: "Pasuruan",
        signatureDate: draft.signatureDate || agreementDate,
        notes: "",
      });

      if (pendingSignature) {
        const result = await api.saveDigitalSignature(saved.id, pendingSignature);
        saved = result.agreement;
      }

      if (pendingFace) {
        const result = await api.saveFaceCapture(saved.id, pendingFace);
        saved = result.agreement;
      }

      setPendingSignature("");
      setPendingFace(null);
      setDraft({ ...saved });
      setIsEditing(false);
      await onSaved(saved);
      setStatus("Perubahan arsip berhasil disimpan.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-6xl space-y-5 px-5 py-5">
      <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
              Detail Arsip
            </p>
            <h2 className="mt-1 text-lg font-black">{agreement.workerName}</h2>
            <p className="text-sm text-slate-500">
              {agreement.jobSection || "Bagian belum tercatat"} -{" "}
              {formatDateLong(agreement.agreementDate)}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className="btn-secondary" type="button" onClick={onBack}>
              <X size={16} />
              Kembali
            </button>
            {isEditing ? (
              <>
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={cancelEdit}
                  disabled={isSaving}
                >
                  Batal Edit
                </button>
                <button
                  className="btn-primary"
                  type="button"
                  onClick={saveEdit}
                  disabled={!canSave || isSaving}
                >
                  {isSaving ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <Save size={16} />
                  )}
                  Simpan Perubahan
                </button>
              </>
            ) : (
              <button
                className="btn-primary"
                type="button"
                onClick={() => setIsEditing(true)}
              >
                <RefreshCcw size={16} />
                Edit
              </button>
            )}
            <button className="btn-secondary" type="button" onClick={onDelete}>
              <Trash2 size={16} />
              Hapus
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <section className="min-w-0 overflow-auto rounded-lg border border-line bg-slate-200/70 p-5">
          <DocumentPreview
            data={isEditing ? draft : agreement}
            pendingSignature={pendingSignature}
            pendingFace={pendingFace}
          />
          <PrintPanel />
        </section>

        <aside className="space-y-5">
          {isEditing ? (
            <ArchiveEditPanel
              draft={draft}
              pendingSignature={pendingSignature}
              pendingFace={pendingFace}
              updateDraft={updateDraft}
              setPendingSignature={setPendingSignature}
              setPendingFace={setPendingFace}
              setStatus={setStatus}
            />
          ) : (
            <>
              <ArchiveVerificationCard agreement={agreement} />
              <ArchiveCompletenessCard agreement={agreement} />
            </>
          )}
        </aside>
      </div>
    </main>
  );
}

function ArchiveEditPanel({
  draft,
  pendingSignature,
  pendingFace,
  updateDraft,
  setPendingSignature,
  setPendingFace,
  setStatus,
}) {
  return (
    <div className="space-y-5">
      <section className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-ink">Edit Data Arsip</h2>
          <span className="rounded-md bg-gold/10 px-2 py-1 text-[11px] font-bold uppercase tracking-[0.12em] text-gold">
            Admin
          </span>
        </div>
        <div className="grid gap-3 text-sm text-slate-600">
          <InfoTile
            label="Tanggal perjanjian"
            value={formatDateLong(draft.agreementDate)}
          />
          <InfoTile label="Tempat dibuat" value="PASURUAN" />
          <InfoTile label="Perusahaan" value={companyDefaults.companyName} />
        </div>
      </section>

      {fieldGroups.map((group) => {
        const Icon = group.icon;
        return (
          <section
            key={group.title}
            className="official-panel rounded-lg border border-line bg-white p-4 shadow-sm"
          >
            <div className="mb-4 flex items-center gap-2">
              <span className="grid h-8 w-8 place-items-center rounded-md bg-navy/10 text-navy">
                <Icon size={17} />
              </span>
              <h2 className="text-sm font-bold text-ink">{group.title}</h2>
            </div>
            <div className="grid gap-3">
              {group.fields.map((field) => (
                <Field
                  key={field.name}
                  field={field}
                  value={draft[field.name]}
                  onChange={updateDraft}
                />
              ))}
            </div>
          </section>
        );
      })}

      <SignaturePad
        form={draft}
        pendingSignature={pendingSignature}
        onPendingSignature={setPendingSignature}
        setStatus={setStatus}
        readyMessage="Tanda tangan baru siap. Klik Simpan Perubahan untuk menyimpan arsip."
      />
      <FaceCapture
        form={draft}
        pendingFace={pendingFace}
        onPendingFace={setPendingFace}
        setStatus={setStatus}
        readyMessage="Foto wajah baru siap. Klik Simpan Perubahan untuk menyimpan arsip."
      />
    </div>
  );
}

function ArchiveVerificationCard({ agreement }) {
  const signatureUrl = assetUrl(agreement.signatureImageUrl);
  const faceUrl = assetUrl(agreement.faceImageUrl);

  return (
    <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
      <h3 className="text-sm font-black uppercase tracking-[0.08em] text-ink">
        Hasil Verifikasi
      </h3>
      <div className="mt-4 space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Tanda Tangan</p>
            <Status value={agreement.eSignatureStatus} />
          </div>
          {signatureUrl ? (
            <img
              src={signatureUrl}
              alt="Tanda tangan pekerja"
              className="h-28 w-full rounded-md border border-line bg-white object-contain p-3"
            />
          ) : (
            <EmptyAsset label="TTD belum tersedia" />
          )}
        </div>
        <div>
          <div className="mb-2 flex items-center justify-between gap-2">
            <p className="text-sm font-bold">Verifikasi Wajah</p>
            <Status value={agreement.faceVerificationStatus} />
          </div>
          {faceUrl ? (
            <img
              src={faceUrl}
              alt="Foto wajah pekerja"
              className="aspect-[4/3] w-full rounded-md border border-line object-cover"
            />
          ) : (
            <EmptyAsset label="Foto wajah belum tersedia" />
          )}
        </div>
      </div>
    </section>
  );
}

function EmptyAsset({ label }) {
  return (
    <div className="grid h-28 place-items-center rounded-md border border-dashed border-slate-300 bg-slate-50 text-sm font-bold text-slate-500">
      {label}
    </div>
  );
}

function ArchiveCompletenessCard({ agreement }) {
  const rows = [
    ["Nama pekerja", agreement.workerName],
    ["Tempat lahir", agreement.workerBirthPlace],
    ["Tanggal lahir", agreement.workerBirthDate],
    ["Alamat", agreement.workerAddress],
    ["No. KTP", agreement.workerKtp],
    ["No. HP", agreement.workerPhone],
    ["Bagian pekerjaan", agreement.jobSection],
    ["Tanggal perjanjian", agreement.agreementDate],
    [
      "Tanda tangan",
      agreement.signatureImageUrl || agreement.eSignatureStatus === "signed",
    ],
    [
      "Foto wajah",
      agreement.faceImageUrl || agreement.faceVerificationStatus === "captured",
    ],
  ];

  const completed = rows.filter(([, value]) => Boolean(value)).length;

  return (
    <section className="official-panel rounded-lg border border-line bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-black uppercase tracking-[0.08em] text-ink">
          Kelengkapan Data
        </h3>
        <span className="rounded-md bg-navy px-2 py-1 text-xs font-bold text-white">
          {completed}/{rows.length}
        </span>
      </div>
      <div className="mt-4 divide-y divide-line">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-3 py-2 text-sm"
          >
            <span className="text-slate-600">{label}</span>
            <span
              className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold ${
                value
                  ? "bg-emerald-50 text-emerald-700"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {value ? <CheckCircle2 size={13} /> : <X size={13} />}
              {value ? "Lengkap" : "Belum"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

export default function App() {
  const [page, setPage] = useState(() => {
    if (window.location.pathname === "/admin") return "admin";
    if (window.location.hash === "#/pengajuan-perubahan")
      return "change-request";
    return "form";
  });
  const [form, setForm] = useState(defaultAgreement);
  const [agreements, setAgreements] = useState([]);
  const [changeRequests, setChangeRequests] = useState([]);
  const [stats, setStats] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [adminTab, setAdminTab] = useState("dashboard");
  const [pendingSignature, setPendingSignature] = useState("");
  const [pendingFace, setPendingFace] = useState(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [successDialog, setSuccessDialog] = useState(null);

  const canSubmit = useMemo(
    () =>
      form.workerName &&
      form.workerBirthPlace &&
      form.workerAddress &&
      form.workerKtp &&
      form.workerPhone &&
      form.jobSection,
    [form],
  );

  const loadAdminData = async (query = search) => {
    setIsLoading(true);
    try {
      const [agreementRows, requestRows, summary] = await Promise.all([
        api.listAgreements(query),
        api.listChangeRequests(),
        api.getAdminStats(),
      ]);
      setAgreements(agreementRows);
      setChangeRequests(requestRows);
      setStats(summary);
      setStatus("");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const syncFromLocation = () => {
      if (window.location.pathname === "/admin") setPage("admin");
      else if (window.location.hash === "#/pengajuan-perubahan")
        setPage("change-request");
      else setPage("form");
    };
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);
    return () => {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  useEffect(() => {
    if (page !== "admin") return;
    api
      .getAdminMe()
      .then((result) => {
        setAdminUser(result.admin);
        loadAdminData("");
      })
      .catch(() => {
        setAdminUser(null);
        setPage("admin-login");
      });
  }, [page]);

  const updateField = (name, value) => {
    setForm((current) => ({ ...current, [name]: value }));
  };

  const resetForm = () => {
    setPendingSignature("");
    setPendingFace(null);
    setForm({ ...defaultAgreement, ...companyDefaults });
    setIsPreviewOpen(false);
    setPage("form");
    window.history.pushState({}, "", "/");
    setStatus("Form baru siap diisi.");
  };

  const submitAgreement = async () => {
    if (!canSubmit) {
      setStatus("Lengkapi data pekerja dan bagian pekerjaan terlebih dahulu.");
      return null;
    }
    setIsLoading(true);
    try {
      const currentDate = today();
      const payload = {
        ...form,
        agreementDate: currentDate,
        agreementDay: formatWeekday(currentDate),
        agreementPlace: "PASURUAN",
        ...companyDefaults,
        dailyWage: Number(form.dailyWage || 0),
        signatureCity: "Pasuruan",
        signatureDate: currentDate,
        notes: "",
      };
      let saved = await api.createAgreement(payload);
      if (pendingSignature) {
        const signatureResult = await api.saveDigitalSignature(
          saved.id,
          pendingSignature,
        );
        saved = signatureResult.agreement;
        setPendingSignature("");
      }
      if (pendingFace) {
        const faceResult = await api.saveFaceCapture(saved.id, pendingFace);
        saved = faceResult.agreement;
        setPendingFace(null);
      }
      setPendingSignature("");
      setPendingFace(null);
      setForm({ ...defaultAgreement, ...companyDefaults });
      setIsPreviewOpen(false);
      setSuccessDialog({
        title: "Data berhasil disubmit",
        message:
          "Perjanjian kerja harian lepas berhasil tersimpan dan masuk ke arsip admin.",
      });
      setStatus("");
      return saved.id;
    } catch (error) {
      setStatus(error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const deleteAgreement = async (id) => {
    const target = agreements.find((item) => item.id === id);
    const confirmed = window.confirm(
      `Hapus perjanjian ${target?.workerName || "ini"}? Data yang dihapus tidak dapat dikembalikan.`,
    );
    if (!confirmed) return false;

    setIsLoading(true);
    try {
      await api.deleteAgreement(id);
      await loadAdminData();
      setStatus("Data berhasil dihapus.");
      return true;
    } catch (error) {
      setStatus(error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logoutAdmin = async () => {
    try {
      await api.logoutAdmin();
    } catch {
      // Session may already be gone.
    }
    setAdminUser(null);
    setPage("admin-login");
    window.history.pushState({}, "", "/admin");
    setStatus("Anda sudah keluar dari admin.");
  };

  const reviewChangeRequest = async (id, reviewStatus) => {
    const label = reviewStatus === "approved" ? "setujui" : "tolak";
    if (!window.confirm(`Yakin ingin ${label} pengajuan perubahan ini?`))
      return;
    try {
      await api.reviewChangeRequest(id, { status: reviewStatus });
      await loadAdminData();
      setStatus(
        `Pengajuan perubahan berhasil di${reviewStatus === "approved" ? "setujui" : "tolak"}.`,
      );
    } catch (error) {
      setStatus(error.message);
    }
  };

  return (
    <div className="min-h-screen bg-mist text-ink">
      <header className="no-print sticky top-0 z-20 border-b border-navy/15 bg-white/95 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-5 py-3">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-navy text-white shadow-sm">
              <FileText size={21} />
            </span>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-gold">
                CV. KRAINING MULTI ABADI
              </p>
              <h1 className="text-base font-black">
                Surat Perjanjian Kerja Harian Lepas
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button className="btn-secondary" type="button" onClick={resetForm}>
              <Plus size={16} />
              Form Baru
            </button>
            <button
              className="btn-secondary"
              type="button"
              onClick={() => {
                setPage("change-request");
                window.location.hash = "#/pengajuan-perubahan";
              }}
            >
              <ClipboardCheck size={16} />
              Pengajuan Perubahan
            </button>
          </div>
        </div>
      </header>

      {status && (
        <div className="no-print mx-auto mt-4 max-w-[1500px] px-5">
          <div className="rounded-lg border border-amber/30 bg-amber/10 p-3 text-sm text-amber-900">
            {status}
          </div>
        </div>
      )}

      {successDialog && (
        <div className="no-print fixed inset-0 z-50 grid place-items-center bg-ink/45 px-5 backdrop-blur-sm">
          <section className="w-full max-w-md rounded-lg border border-line bg-white p-5 text-center shadow-xl">
            <span className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-emerald-100 text-emerald-700">
              <CheckCircle2 size={24} />
            </span>
            <h2 className="mt-4 text-lg font-black text-ink">
              {successDialog.title}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              {successDialog.message}
            </p>
            <button
              className="btn-primary mt-5 w-full justify-center"
              type="button"
              onClick={() => setSuccessDialog(null)}
            >
              Tutup
            </button>
          </section>
        </div>
      )}

      {page === "admin-login" ? (
        <AdminLoginPage
          onLogin={setAdminUser}
          setPage={setPage}
          setStatus={setStatus}
        />
      ) : page === "admin" ? (
        <AdminPage
          adminUser={adminUser}
          adminTab={adminTab}
          setAdminTab={setAdminTab}
          stats={stats}
          agreements={agreements}
          changeRequests={changeRequests}
          search={search}
          setSearch={setSearch}
          loadAdminData={loadAdminData}
          deleteAgreement={deleteAgreement}
          reviewChangeRequest={reviewChangeRequest}
          logoutAdmin={logoutAdmin}
          setStatus={setStatus}
        />
      ) : page === "change-request" ? (
        <ChangeRequestPage setPage={setPage} setStatus={setStatus} />
      ) : (
        <main className="mx-auto grid max-w-[1500px] gap-5 px-5 pb-28 pt-5 lg:grid-cols-[minmax(420px,640px)_1fr] lg:pb-5">
          <section className="min-w-0 space-y-4">
            <section className="rounded-lg border border-navy/15 bg-navy px-5 py-4 text-white shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-gold">
                Formulir Resmi
              </p>
              <h2 className="mt-1 text-lg font-black">
                CV. KRAINING MULTI ABADI
              </h2>
              <p className="mt-1 text-sm text-white/75">
                JL.KH. MANSYUR RT.05/RW.01, TembokRejo - Pasuruan
              </p>
            </section>
            <AgreementForm form={form} onChange={updateField} />
            <SignaturePad
              form={form}
              pendingSignature={pendingSignature}
              onPendingSignature={setPendingSignature}
              setStatus={setStatus}
            />
            <FaceCapture
              form={form}
              pendingFace={pendingFace}
              onPendingFace={setPendingFace}
              setStatus={setStatus}
            />
            <button
              className="btn-primary h-12 w-full"
              type="button"
              onClick={submitAgreement}
              disabled={!canSubmit || isLoading}
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={16} />
              ) : (
                <Save size={16} />
              )}
              Submit
            </button>
          </section>
          <section className="hidden min-w-0 overflow-auto rounded-lg border border-line bg-slate-200/70 p-5 lg:block">
            <DocumentPreview
              data={form}
              pendingSignature={pendingSignature}
              pendingFace={pendingFace}
            />
            <PrintPanel />
          </section>
          <button
            className="btn-primary fixed bottom-4 left-4 right-4 z-30 h-12 justify-center shadow-xl lg:hidden"
            type="button"
            onClick={() => setIsPreviewOpen(true)}
          >
            <FileText size={16} />
            Preview Surat
          </button>
          {isPreviewOpen && (
            <div className="fixed inset-0 z-40 flex flex-col bg-mist lg:hidden">
              <div className="flex items-center justify-between border-b border-line bg-white px-4 py-3 shadow-sm">
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => setIsPreviewOpen(false)}
                >
                  <X size={16} />
                  Kembali
                </button>
                <PrintPanel compact />
              </div>
              <div className="flex-1 overflow-auto bg-slate-200/70 p-4">
                <DocumentPreview
                  data={form}
                  pendingSignature={pendingSignature}
                  pendingFace={pendingFace}
                />
              </div>
            </div>
          )}
        </main>
      )}
    </div>
  );
}
