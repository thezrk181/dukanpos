import { useCallback, useEffect, useRef, useState, type Dispatch, type FormEvent, type ReactNode, type SetStateAction } from 'react';
import { Link, Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import {
  ArrowDownLeft, ArrowUpRight, Banknote, BarChart3, Boxes, Check, ChevronDown,
  CircleDollarSign, CreditCard, FileText, LayoutGrid, Menu, Minus, Package, Plus, Printer,
  Receipt, ScanBarcode, Search, Settings2, ShoppingBasket, Trash2, UserRound, Users, Wallet, X, Zap,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

type Product = { id: string; name: string; category: string; price: number; cost: number; stock: number; unit: string; accent: string; barcode?: string };
type Customer = { id: string; name: string; phone: string; balance: number; initials: string };
type Sale = { id: string; items: { productId: string; name: string; qty: number; price: number }[]; total: number; paid: number; type: 'cash' | 'udhaar'; customerId?: string; createdAt: string };
type CartItem = { productId: string; qty: number };
type State = { products: Product[]; customers: Customer[]; sales: Sale[] };

const seed: State = {
  products: [
    { id: 'atta-10', name: 'Ashrafi Atta 10kg', category: 'Kiryana', price: 1380, cost: 1210, stock: 12, unit: 'bag', accent: 'bg-[#e9d8b8]', barcode: '8964001000010' },
    { id: 'milk-1', name: 'Olper’s Milk 1L', category: 'Dairy', price: 285, cost: 266, stock: 24, unit: 'pack', accent: 'bg-[#d8e8e6]', barcode: '8964001000027' },
    { id: 'tea-95', name: 'Tapal Danedar 95g', category: 'Kiryana', price: 270, cost: 236, stock: 18, unit: 'box', accent: 'bg-[#f5c977]', barcode: '8964001000034' },
    { id: 'oil-1', name: 'Dalda Cooking Oil 1L', category: 'Kiryana', price: 585, cost: 548, stock: 9, unit: 'bottle', accent: 'bg-[#f4ddd4]', barcode: '8964001000041' },
    { id: 'sugar-1', name: 'Fine Sugar 1kg', category: 'Kiryana', price: 172, cost: 153, stock: 31, unit: 'bag', accent: 'bg-[#eeeee3]', barcode: '8964001000058' },
    { id: 'biscuit', name: 'Sooper Biscuit', category: 'Snacks', price: 35, cost: 29, stock: 46, unit: 'pack', accent: 'bg-[#e1ded3]', barcode: '8964001000065' },
    { id: 'surf', name: 'Surf Excel 500g', category: 'Household', price: 345, cost: 316, stock: 4, unit: 'pack', accent: 'bg-[#e2d9eb]', barcode: '8964001000072' },
    { id: 'water', name: 'Nestlé Pure Life 1.5L', category: 'Drinks', price: 110, cost: 92, stock: 3, unit: 'bottle', accent: 'bg-[#d9e3f0]', barcode: '8964001000089' },
  ],
  customers: [
    { id: 'c-1', name: 'Haji Imran', phone: '0300 814 2290', balance: 2150, initials: 'HI' },
    { id: 'c-2', name: 'Nazia Begum', phone: '0333 202 1176', balance: 780, initials: 'NB' },
    { id: 'c-3', name: 'Rashid Bhai', phone: '0312 551 8094', balance: 450, initials: 'RB' },
  ],
  sales: [
    { id: 's-1', items: [{ productId: 'milk-1', name: 'Olper’s Milk 1L', qty: 2, price: 285 }], total: 570, paid: 570, type: 'cash', createdAt: new Date().toISOString() },
    { id: 's-2', items: [{ productId: 'tea-95', name: 'Tapal Danedar 95g', qty: 1, price: 270 }, { productId: 'biscuit', name: 'Sooper Biscuit', qty: 2, price: 35 }], total: 340, paid: 0, type: 'udhaar', customerId: 'c-1', createdAt: new Date().toISOString() },
  ],
};

const money = (n: number) => `Rs ${Math.round(n).toLocaleString('en-PK')}`;
const today = () => new Date().toISOString().slice(0, 10);
const dateLabel = () => new Intl.DateTimeFormat('en-PK', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
function loadState(): State {
  try {
    const raw = localStorage.getItem('dukan-pos-state');
    if (!raw) return seed;
    const saved = JSON.parse(raw) as Partial<State>;
    const barcodes = new Map(seed.products.map((p) => [p.id, p.barcode]));
    return {
      products: (saved.products ?? seed.products).map((p) => ({ ...p, barcode: p.barcode || barcodes.get(p.id) })),
      customers: saved.customers ?? seed.customers,
      sales: saved.sales ?? [],
    };
  } catch { return seed; }
}
function initials(name: string) { return name.split(' ').map((x) => x[0]).slice(0, 2).join('').toUpperCase(); }

function Logo({ compact = false }: { compact?: boolean }) {
  return <div className="flex items-center gap-2.5"><div className="grid h-10 w-10 place-items-center rounded-xl bg-[#f4c95d] text-[#243348] shadow-sm"><ShoppingBasket size={21} strokeWidth={2.5} /></div>{!compact && <div><div className="font-display text-[22px] leading-none text-[#fffaf0]">dukan</div><div className="font-mono text-[9px] uppercase tracking-[.24em] text-[#b6c1c9]">counter book</div></div>}</div>;
}

function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const links = [{ href: '/', label: 'Counter', icon: LayoutGrid }, { href: '/inventory', label: 'Inventory', icon: Boxes }, { href: '/udhaar', label: 'Udhaar', icon: Users }, { href: '/summary', label: 'Today', icon: BarChart3 }];
  return <div className="min-h-[100dvh] bg-background">
    <aside className={`no-print fixed inset-y-0 left-0 z-40 w-[248px] bg-sidebar px-4 py-5 text-sidebar-foreground transition-transform md:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="flex items-center justify-between px-2"><Logo /><button data-testid="button-close-menu" onClick={() => setOpen(false)} className="rounded-lg p-2 text-[#b6c1c9] hover:bg-sidebar-accent md:hidden"><X size={18} /></button></div>
      <div className="mt-10 px-2 text-[10px] font-bold uppercase tracking-[.2em] text-[#8493a0]">Shop floor</div>
      <nav className="mt-3 space-y-1">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`link-${label.toLowerCase()}`} onClick={() => setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${location === href ? 'bg-[#f4c95d] text-[#243348]' : 'text-[#d2d9dd] hover:bg-sidebar-accent'}`}><Icon size={18} /><span>{label}</span>{href === '/udhaar' && <span className="ml-auto rounded-full bg-[#ee8b70] px-2 py-0.5 text-[10px] text-white">3</span>}</Link>)}</nav>
      <div className="mt-12 rounded-2xl border border-sidebar-border bg-[#293b50] p-4"><div className="flex items-center gap-2 text-[#f4c95d]"><Zap size={16} fill="currentColor" /><span className="text-xs font-bold">Works offline</span></div><p className="mt-2 text-xs leading-5 text-[#aebbc5]">Your sales stay on this device, even when the signal disappears.</p><div className="mt-3 flex items-center gap-1.5 text-[10px] font-mono text-[#89c4ad]"><span className="h-1.5 w-1.5 rounded-full bg-[#89c4ad]" /> ALL DATA SAVED</div></div>
      <div className="absolute bottom-5 left-6 right-6 flex items-center gap-3 border-t border-sidebar-border pt-4"><div className="grid h-8 w-8 place-items-center rounded-full bg-[#dbe6dd] text-xs font-bold text-primary">AK</div><div className="min-w-0"><p className="truncate text-xs font-bold">Aamir Khan</p><p className="truncate text-[10px] text-[#91a0ac]">Al-Khan General Store</p></div><Settings2 size={15} className="ml-auto text-[#8e9aa5]" /></div>
    </aside>
    {open && <button aria-label="Close menu" data-testid="button-overlay-menu" onClick={() => setOpen(false)} className="no-print fixed inset-0 z-30 bg-[#182433]/50 md:hidden" />}
    <main className="md:pl-[248px]">{children}</main>
    <nav className="no-print fixed bottom-0 left-0 right-0 z-20 border-t border-border bg-card/95 px-2 py-2 backdrop-blur md:hidden"><div className="grid grid-cols-4">{links.map(({ href, label, icon: Icon }) => <Link key={href} href={href} data-testid={`mobile-link-${label.toLowerCase()}`} className={`flex flex-col items-center gap-1 py-1 text-[10px] font-semibold ${location === href ? 'text-primary' : 'text-muted-foreground'}`}><Icon size={19} /><span>{label}</span></Link>)}</div></nav>
    <button data-testid="button-open-menu" onClick={() => setOpen(true)} className="no-print fixed left-4 top-4 z-20 rounded-xl border border-border bg-card p-2.5 text-primary shadow-sm md:hidden"><Menu size={19} /></button>
  </div>;
}

function Topbar({ title, eyebrow, action }: { title: string; eyebrow: string; action?: ReactNode }) {
  return <header className="no-print flex items-start justify-between gap-4 border-b border-border px-5 py-5 md:px-9 md:py-7"><div className="pl-12 md:pl-0"><p className="font-mono text-[10px] font-semibold uppercase tracking-[.18em] text-muted-foreground">{eyebrow}</p><h1 className="mt-1 font-display text-[29px] leading-tight text-foreground md:text-[35px]">{title}</h1></div>{action}</header>;
}

function ScannerModal({ onCode, onClose }: { onCode: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState<'starting' | 'camera' | 'manual'>('starting');
  const [value, setValue] = useState('');

  useEffect(() => {
    let stream: MediaStream | undefined;
    let timer: number | undefined;
    let stopped = false;
    const start = async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setStatus('manual');
        return;
      }
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' } }, audio: false });
        if (stopped) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
        const Detector = (window as Window & { BarcodeDetector?: new (options?: { formats: string[] }) => { detect: (video: HTMLVideoElement) => Promise<{ rawValue?: string }[]> } }).BarcodeDetector;
        if (!Detector) {
          setStatus('manual');
          return;
        }
        const detector = new Detector({ formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'qr_code'] });
        setStatus('camera');
        const scan = async () => {
          if (stopped || !videoRef.current) return;
          try {
            const results = await detector.detect(videoRef.current);
            if (results[0]?.rawValue) {
              stopped = true;
              onCode(results[0].rawValue);
              return;
            }
          } catch {
            // Keep the manual barcode field available when camera detection fails.
          }
          timer = window.setTimeout(scan, 250);
        };
        scan();
      } catch {
        setStatus('manual');
      }
    };
    start();
    return () => {
      stopped = true;
      if (timer) window.clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [onCode]);

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (value.trim()) onCode(value.trim());
  };

  return <div className="no-print fixed inset-0 z-50 grid place-items-center bg-[#182433]/65 p-4">
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-card shadow-2xl animate-rise">
      <div className="flex items-center justify-between border-b border-border p-5">
        <div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Product lookup</p><h2 className="mt-1 font-display text-2xl">Scan an item</h2></div>
        <button data-testid="button-close-scanner" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button>
      </div>
      <div className="p-5">
        <div className="relative overflow-hidden rounded-xl bg-[#182433]">
          <video ref={videoRef} muted playsInline className={`h-48 w-full object-cover ${status === 'manual' ? 'hidden' : 'block'}`} />
          {status !== 'manual' && <div className="pointer-events-none absolute inset-x-8 top-1/2 h-0.5 bg-[#f4c95d] shadow-[0_0_18px_#f4c95d]" />}
          {status === 'starting' && <div className="absolute inset-0 grid place-items-center text-center text-sm text-white"><div><ScanBarcode className="mx-auto mb-2 text-[#f4c95d]" size={30} /><p>Opening camera…</p></div></div>}
          {status === 'manual' && <div className="grid h-48 place-items-center p-6 text-center text-white"><div><ScanBarcode className="mx-auto mb-2 text-[#f4c95d]" size={30} /><p className="text-sm font-semibold">Camera scanning is unavailable here.</p><p className="mt-1 text-xs text-white/65">Enter the barcode below, or search by product name.</p></div></div>}
        </div>
        <form onSubmit={submit} className="mt-4">
          <label className="text-xs font-bold">Barcode number
            <input data-testid="input-barcode" autoFocus={status === 'manual'} value={value} onChange={(event) => setValue(event.target.value)} placeholder="Type or scan a barcode" className="mt-1 h-12 w-full rounded-xl border border-border bg-background px-4 font-mono text-lg" />
          </label>
          <div className="mt-3 flex gap-2">
            <button type="button" data-testid="button-search-instead" onClick={onClose} className="flex-1 rounded-xl border border-border py-3 text-xs font-bold text-muted-foreground">Search instead</button>
            <button type="submit" data-testid="button-submit-barcode" disabled={!value.trim()} className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground disabled:cursor-not-allowed disabled:opacity-40">Find product</button>
          </div>
        </form>
      </div>
    </div>
  </div>;
}

function Counter({ state, setState, notify }: { state: State; setState: Dispatch<SetStateAction<State>>; notify: (s: string) => void }) {
  const [query, setQuery] = useState(''); const [category, setCategory] = useState('All'); const [cart, setCart] = useState<CartItem[]>([]); const [checkout, setCheckout] = useState<'cash' | 'udhaar' | null>(null); const [customer, setCustomer] = useState(''); const [paid, setPaid] = useState(''); const [receipt, setReceipt] = useState<Sale | null>(null); const [scanner, setScanner] = useState(false);
  const categories = ['All', ...Array.from(new Set(state.products.map((p) => p.category)))];
  const products = state.products.filter((p) => (category === 'All' || p.category === category) && (p.name.toLowerCase().includes(query.toLowerCase()) || p.barcode?.includes(query.trim())));
  const cartRows = cart.map((i) => ({ ...i, product: state.products.find((p) => p.id === i.productId)! })).filter((i) => i.product);
  const total = cartRows.reduce((a, i) => a + i.product.price * i.qty, 0);
  const add = (p: Product) => { if (p.stock < 1) return notify('This item is out of stock'); setCart((c) => c.some((i) => i.productId === p.id) ? c.map((i) => i.productId === p.id ? { ...i, qty: Math.min(i.qty + 1, p.stock) } : i) : [...c, { productId: p.id, qty: 1 }]); notify(`${p.name} added to basket`); };
  const handleScan = useCallback((code: string) => { setScanner(false); const cleaned = code.trim(); const match = state.products.find((p) => p.barcode === cleaned); if (match) { add(match); return; } setQuery(cleaned); notify(`Barcode ${cleaned} not found — showing search results`); }, [state.products, notify]);
  const setQty = (id: string, qty: number) => setCart((c) => qty < 1 ? c.filter((i) => i.productId !== id) : c.map((i) => i.productId === id ? { ...i, qty } : i));
  const complete = () => { if (!cartRows.length) return; if (checkout === 'udhaar' && !customer) return notify('Choose a customer for udhaar'); const paidValue = checkout === 'cash' ? Number(paid || total) : 0; if (checkout === 'cash' && paidValue < total) return notify(`Cash is short by ${money(total - paidValue)}`); const sale: Sale = { id: `s-${Date.now()}`, items: cartRows.map((i) => ({ productId: i.product.id, name: i.product.name, qty: i.qty, price: i.product.price })), total, paid: paidValue, type: checkout || 'cash', customerId: checkout === 'udhaar' ? customer : undefined, createdAt: new Date().toISOString() }; setState((s) => ({ ...s, sales: [sale, ...s.sales], products: s.products.map((p) => { const item = cart.find((i) => i.productId === p.id); return item ? { ...p, stock: p.stock - item.qty } : p; }), customers: checkout === 'udhaar' ? s.customers.map((c) => c.id === customer ? { ...c, balance: c.balance + total } : c) : s.customers })); setReceipt(sale); setCart([]); setCheckout(null); setPaid(''); setCustomer(''); notify(checkout === 'udhaar' ? 'Udhaar recorded' : 'Sale completed'); };
  return <><Topbar eyebrow={dateLabel()} title="Good morning, Aamir" action={<button data-testid="button-scan" onClick={() => setScanner(true)} className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-primary shadow-sm hover:bg-muted"><ScanBarcode size={17} /> <span className="hidden sm:inline">Scan item</span></button>} />
    <div className="grid gap-5 p-5 pb-24 md:grid-cols-[1fr_390px] md:gap-7 md:p-9">
      <section className="min-w-0">
        <div className="relative"><Search size={18} className="absolute left-4 top-3.5 text-muted-foreground" /><input data-testid="input-product-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search products or barcode..." className="h-12 w-full rounded-xl border border-border bg-card pl-11 pr-4 text-sm shadow-sm placeholder:text-muted-foreground" /></div>
        <div className="mt-4 flex gap-2 overflow-x-auto pb-1">{categories.map((c) => <button key={c} data-testid={`filter-category-${c.toLowerCase()}`} onClick={() => setCategory(c)} className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-bold transition ${category === c ? 'bg-primary text-primary-foreground' : 'border border-border bg-card text-muted-foreground hover:text-foreground'}`}>{c}</button>)}</div>
        <div className="mt-6 flex items-center justify-between"><div><h2 className="font-display text-2xl">Quick sale</h2><p className="mt-0.5 text-xs text-muted-foreground">{products.length} items on your shelf</p></div><span className="rounded-lg bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold text-accent">FAVOURITES</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">{products.map((p, idx) => <button key={p.id} data-testid={`card-product-${p.id}`} onClick={() => add(p)} className={`group relative overflow-hidden rounded-2xl border border-border bg-card p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-counter ${idx === 0 ? 'sm:col-span-2 sm:row-span-2' : ''}`}><div className={`flex ${idx === 0 ? 'h-32' : 'h-20'} items-center justify-center rounded-xl ${p.accent}`}><Package size={idx === 0 ? 39 : 27} className="text-[#243348]/35 transition group-hover:scale-110" /></div><div className="mt-3"><div className="flex items-start justify-between gap-2"><p data-testid={`text-product-name-${p.id}`} className="text-xs font-bold leading-4 text-foreground">{p.name}</p><span className="rounded-md bg-muted px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground">{p.stock}</span></div><p data-testid={`text-product-price-${p.id}`} className="mt-2 font-mono text-sm font-semibold text-primary">{money(p.price)}</p></div></button>)}</div>
        {products.length === 0 && <div className="mt-5 rounded-2xl border border-dashed border-border bg-card px-5 py-14 text-center"><Package className="mx-auto text-muted-foreground" size={28} /><p className="mt-3 font-display text-xl">Nothing on that shelf</p><p className="mt-1 text-sm text-muted-foreground">Try another name or category.</p></div>}
      </section>
      <aside className="h-fit overflow-hidden rounded-2xl border border-border bg-card shadow-counter md:sticky md:top-6"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="font-display text-2xl">Current basket</h2><p data-testid="text-cart-count" className="mt-0.5 text-xs text-muted-foreground">{cartRows.reduce((a, i) => a + i.qty, 0)} items</p></div><div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary"><Receipt size={18} /></div></div><div className="min-h-[170px] px-5 py-3">{cartRows.length ? cartRows.map(({ product: p, qty }) => <div key={p.id} data-testid={`row-cart-${p.id}`} className="flex items-center gap-3 border-b border-border/70 py-3 last:border-0"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${p.accent}`}><Package size={16} className="text-[#243348]/40" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{p.name}</p><p className="font-mono text-[11px] text-muted-foreground">{money(p.price)}</p></div><div className="flex items-center gap-1 rounded-lg bg-muted p-1"><button data-testid={`button-decrease-${p.id}`} onClick={() => setQty(p.id, qty - 1)} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-card"><Minus size={12} /></button><span className="w-5 text-center font-mono text-xs font-bold">{qty}</span><button data-testid={`button-increase-${p.id}`} onClick={() => setQty(p.id, Math.min(qty + 1, p.stock))} className="grid h-6 w-6 place-items-center rounded text-muted-foreground hover:bg-card"><Plus size={12} /></button></div><span className="w-16 text-right font-mono text-xs font-bold">{money(p.price * qty)}</span></div>) : <div className="flex h-[170px] flex-col items-center justify-center text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><ShoppingBasket size={23} /></div><p className="mt-3 text-sm font-bold">Basket is ready</p><p className="mt-1 max-w-[210px] text-xs leading-5 text-muted-foreground">Tap a product to start a new sale.</p></div>}</div><div className="border-t border-border bg-[#fbf7ed] px-5 py-4"><div className="flex items-center justify-between"><span className="text-sm font-semibold text-muted-foreground">Total</span><strong data-testid="text-cart-total" className="font-mono text-2xl text-primary">{money(total)}</strong></div><button data-testid="button-checkout" disabled={!cartRows.length} onClick={() => setCheckout('cash')} className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-sm font-bold text-primary-foreground transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"><Banknote size={18} /> Take payment</button></div></aside>
    </div>
    {checkout && <Modal title={checkout === 'cash' ? 'Cash payment' : 'Udhaar sale'} onClose={() => setCheckout(null)}><div className="space-y-4"><div className="rounded-xl bg-secondary p-4 text-center"><p className="text-xs font-semibold text-muted-foreground">Amount due</p><p className="mt-1 font-mono text-3xl font-bold text-primary">{money(total)}</p></div>{checkout === 'cash' ? <label className="block text-sm font-bold">Cash received<input autoFocus data-testid="input-cash-received" type="number" value={paid} onChange={(e) => setPaid(e.target.value)} placeholder={String(total)} className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 font-mono text-lg" /></label> : <label className="block text-sm font-bold">Customer<select data-testid="select-udhaar-customer" value={customer} onChange={(e) => setCustomer(e.target.value)} className="mt-2 h-12 w-full rounded-xl border border-border bg-card px-4 text-sm"><option value="">Choose customer</option>{state.customers.map((c) => <option key={c.id} value={c.id}>{c.name} · {money(c.balance)} due</option>)}</select></label>}<div className="flex gap-2"><button data-testid="button-switch-udhaar" onClick={() => setCheckout(checkout === 'cash' ? 'udhaar' : 'cash')} className="flex-1 rounded-xl border border-border py-3 text-xs font-bold text-muted-foreground">{checkout === 'cash' ? 'Record as udhaar' : 'Pay cash instead'}</button><button data-testid="button-complete-sale" onClick={complete} className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground">Complete sale</button></div></div></Modal>}
    {scanner && <ScannerModal onCode={handleScan} onClose={() => setScanner(false)} />}
    {receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}
  </>;
}

function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) { return <div className="no-print fixed inset-0 z-50 grid place-items-center bg-[#182433]/55 p-4"><div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl animate-rise"><div className="flex items-center justify-between"><h2 className="font-display text-2xl">{title}</h2><button data-testid="button-close-modal" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div><div className="mt-5">{children}</div></div></div>; }

function ReceiptModal({ sale, onClose }: { sale: Sale; onClose: () => void }) {
  return <div className="receipt-overlay fixed inset-0 z-50 grid place-items-center bg-[#182433]/55 p-4">
    <div className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-2xl animate-rise">
      <div className="no-print flex items-center justify-between"><div><p className="font-mono text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Saved transaction</p><h2 className="mt-1 font-display text-2xl">Receipt ready</h2></div><button data-testid="button-close-receipt" onClick={onClose} className="rounded-lg p-2 text-muted-foreground hover:bg-muted"><X size={18} /></button></div>
      <div className="print-receipt mt-5 rounded-xl border border-dashed border-border bg-[#fffdf8] p-5 font-mono text-xs">
        <div className="text-center"><div className="font-display text-2xl text-primary">dukan</div><p className="mt-1 text-[10px] text-muted-foreground">Al-Khan General Store · Lahore</p><p className="mt-1 text-[10px] text-muted-foreground">{new Date(sale.createdAt).toLocaleString('en-PK')}</p><p className="mt-1 text-[10px] uppercase text-muted-foreground">{sale.type === 'cash' ? 'Cash sale' : 'Udhaar sale'}</p></div>
        <div className="my-4 border-t border-dashed border-border" />
        {sale.items.map((item) => <div className="flex justify-between gap-4 py-1" key={`${sale.id}-${item.productId}`}><span>{item.name} × {item.qty}</span><span>{money(item.price * item.qty)}</span></div>)}
        <div className="my-3 border-t border-dashed border-border" />
        <div className="flex justify-between font-bold"><span>TOTAL</span><span>{money(sale.total)}</span></div>
        {sale.type === 'cash' && <><div className="mt-2 flex justify-between text-muted-foreground"><span>Cash received</span><span>{money(sale.paid)}</span></div><div className="flex justify-between text-muted-foreground"><span>Change</span><span>{money(Math.max(0, sale.paid - sale.total))}</span></div></>}
        <p className="mt-5 text-center text-[10px] text-muted-foreground">Shukriya — phir tashreef laayein</p>
      </div>
      <div className="receipt-actions no-print mt-4 flex gap-2"><button data-testid="button-print-receipt" onClick={() => window.print()} className="flex-1 rounded-xl border border-border py-3 text-xs font-bold"><Printer size={15} className="mr-2 inline" /> Print receipt</button><button data-testid="button-done-receipt" onClick={onClose} className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground"><Check size={15} className="mr-2 inline" /> Done</button></div>
    </div>
  </div>;
}

function Inventory({ state, setState, notify }: { state: State; setState: Dispatch<SetStateAction<State>>; notify: (s: string) => void }) {
  const [search, setSearch] = useState(''); const [modal, setModal] = useState<Product | 'new' | null>(null); const [form, setForm] = useState({ name: '', category: 'Kiryana', price: '', cost: '', stock: '', unit: 'pack', barcode: '' });
  const list = state.products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search.trim()));
  const edit = (p: Product) => { setForm({ name: p.name, category: p.category, price: String(p.price), cost: String(p.cost), stock: String(p.stock), unit: p.unit, barcode: p.barcode || '' }); setModal(p); };
  const save = () => { const current = modal; if (!current) return; if (!form.name || !form.price) return notify('Add a product name and selling price'); const duplicate = state.products.some((item) => item.barcode && form.barcode.trim() && item.barcode === form.barcode.trim() && (current === 'new' || item.id !== current.id)); if (duplicate) return notify('That barcode is already assigned'); const p: Product = { id: current === 'new' ? `p-${Date.now()}` : current.id, name: form.name.trim(), category: form.category, price: Number(form.price), cost: Number(form.cost) || 0, stock: Math.max(0, Number(form.stock) || 0), unit: form.unit.trim() || 'pack', barcode: form.barcode.trim() || undefined, accent: current === 'new' ? 'bg-[#dbe6dd]' : current.accent }; setState((s) => ({ ...s, products: current === 'new' ? [p, ...s.products] : s.products.map((x) => x.id === p.id ? p : x) })); setModal(null); notify(current === 'new' ? 'Product added to shelf' : 'Product updated'); };
  const del = (id: string) => { if (window.confirm('Remove this product from inventory?')) { setState((s) => ({ ...s, products: s.products.filter((p) => p.id !== id) })); notify('Product removed'); } };
  return <><Topbar eyebrow="Stock room" title="Inventory" action={<button data-testid="button-add-product" onClick={() => { setForm({ name: '', category: 'Kiryana', price: '', cost: '', stock: '', unit: 'pack', barcode: '' }); setModal('new'); }} className="mt-1 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground hover:brightness-110"><Plus size={17} /> Add product</button>} /><div className="p-5 pb-24 md:p-9"><div className="mb-5 grid gap-3 sm:grid-cols-3"><Stat icon={Package} label="Total products" value={String(state.products.length)} tint="teal" /><Stat icon={ArrowDownLeft} label="Low stock" value={String(state.products.filter((p) => p.stock < 6).length)} tint="coral" /><Stat icon={CircleDollarSign} label="Shelf value" value={money(state.products.reduce((a, p) => a + p.cost * p.stock, 0))} tint="yellow" /></div><div className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex flex-col gap-3 border-b border-border p-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="font-display text-2xl">All products</h2><p className="text-xs text-muted-foreground">Keep your shelf count honest.</p></div><div className="relative sm:w-64"><Search size={16} className="absolute left-3 top-3 text-muted-foreground" /><input data-testid="input-inventory-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find by name or barcode..." className="h-10 w-full rounded-lg border border-border bg-background pl-9 pr-3 text-xs" /></div></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="bg-muted/60 text-[10px] uppercase tracking-wider text-muted-foreground"><tr><th className="px-5 py-3 font-bold">Product</th><th className="px-4 py-3 font-bold">Barcode</th><th className="px-4 py-3 font-bold">Category</th><th className="px-4 py-3 font-bold">Selling price</th><th className="px-4 py-3 font-bold">In stock</th><th className="px-4 py-3" /></tr></thead><tbody>{list.map((p) => <tr key={p.id} data-testid={`row-inventory-${p.id}`} className="border-t border-border/70"><td className="px-5 py-3"><div className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-lg ${p.accent}`}><Package size={16} className="text-[#243348]/40" /></div><div><p className="text-xs font-bold">{p.name}</p><p className="font-mono text-[10px] text-muted-foreground">Cost {money(p.cost)}</p></div></div></td><td className="px-4 font-mono text-[10px] text-muted-foreground">{p.barcode || '—'}</td><td className="px-4 text-xs text-muted-foreground">{p.category}</td><td className="px-4 font-mono text-xs font-bold text-primary">{money(p.price)}</td><td className="px-4"><span className={`rounded-md px-2 py-1 font-mono text-[10px] font-bold ${p.stock < 6 ? 'bg-accent/10 text-accent' : 'bg-secondary text-primary'}`}>{p.stock} {p.unit}s</span></td><td className="px-4 text-right"><button data-testid={`button-edit-product-${p.id}`} onClick={() => edit(p)} className="mr-1 rounded-lg p-2 text-muted-foreground hover:bg-muted hover:text-primary"><Settings2 size={15} /></button><button data-testid={`button-delete-product-${p.id}`} onClick={() => del(p.id)} className="rounded-lg p-2 text-muted-foreground hover:bg-accent/10 hover:text-destructive"><Trash2 size={15} /></button></td></tr>)}</tbody></table></div>{!list.length && <Empty icon={Package} title="Shelf is clear" text="No products match this search." />}</div></div>{modal && <Modal title={modal === 'new' ? 'Add product' : 'Edit product'} onClose={() => setModal(null)}><div className="grid gap-3"><label className="text-xs font-bold">Product name<input data-testid="input-product-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm" placeholder="e.g. Shan Masala 100g" /></label><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Category<select data-testid="select-product-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border bg-card px-3 text-sm"><option>Kiryana</option><option>Dairy</option><option>Snacks</option><option>Household</option><option>Drinks</option></select></label><label className="text-xs font-bold">Unit<input data-testid="input-product-unit" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Barcode<input data-testid="input-product-barcode" value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} placeholder="Optional" className="mt-1 h-11 w-full rounded-lg border border-border px-3 font-mono" /></label><label className="text-xs font-bold">Sell price<input data-testid="input-product-price" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border px-3 font-mono" /></label></div><div className="grid grid-cols-2 gap-3"><label className="text-xs font-bold">Cost<input data-testid="input-product-cost" type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border px-3 font-mono" /></label><label className="text-xs font-bold">Stock<input data-testid="input-product-stock" type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: e.target.value })} className="mt-1 h-11 w-full rounded-lg border border-border px-3 font-mono" /></label></div><button data-testid="button-save-product" onClick={save} className="mt-2 rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground">Save product</button></div></Modal>}</>;
}

function Stat({ icon: Icon, label, value, tint }: { icon: typeof Package; label: string; value: string; tint: string }) { return <div className="rounded-2xl border border-border bg-card p-4 shadow-sm"><div className="flex items-center justify-between"><span className={`grid h-9 w-9 place-items-center rounded-xl ${tint === 'coral' ? 'bg-accent/10 text-accent' : tint === 'yellow' ? 'bg-[#f4c95d]/25 text-[#9d7010]' : 'bg-secondary text-primary'}`}><Icon size={17} /></span><ArrowUpRight size={15} className="text-muted-foreground" /></div><p data-testid={`text-stat-${label.replaceAll(' ', '-')}`} className="mt-4 font-mono text-xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }
function Empty({ icon: Icon, title, text }: { icon: typeof Package; title: string; text: string }) { return <div className="px-5 py-14 text-center"><Icon className="mx-auto text-muted-foreground" size={30} /><p className="mt-3 font-display text-xl">{title}</p><p className="mt-1 text-sm text-muted-foreground">{text}</p></div>; }

function Udhaar({ state, setState, notify }: { state: State; setState: Dispatch<SetStateAction<State>>; notify: (s: string) => void }) {
  const [search, setSearch] = useState(''); const [modal, setModal] = useState<'new' | Customer | null>(null); const [name, setName] = useState(''); const [phone, setPhone] = useState(''); const [payment, setPayment] = useState('');
  const people = state.customers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())); const totalDue = state.customers.reduce((a, c) => a + c.balance, 0);
  const saveCustomer = () => { if (!name) return; const c: Customer = { id: `c-${Date.now()}`, name, phone, balance: 0, initials: initials(name) }; setState((s) => ({ ...s, customers: [c, ...s.customers] })); setModal(null); setName(''); setPhone(''); notify('Customer added'); };
  const pay = (c: Customer) => { const amt = Number(payment); if (!amt || amt > c.balance) return notify('Enter a valid payment'); setState((s) => ({ ...s, customers: s.customers.map((x) => x.id === c.id ? { ...x, balance: x.balance - amt } : x) })); setPayment(''); setModal(null); notify(`${money(amt)} payment recorded`); };
  return <><Topbar eyebrow="Credit book" title="Udhaar accounts" action={<button data-testid="button-add-customer" onClick={() => { setName(''); setPhone(''); setModal('new'); }} className="mt-1 flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-primary-foreground"><Plus size={17} /> Add customer</button>} /><div className="p-5 pb-24 md:p-9"><div className="grid gap-3 sm:grid-cols-[1.4fr_1fr_1fr]"><div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-counter"><div className="flex items-center gap-2 text-xs font-semibold opacity-75"><Wallet size={16} /> Total outstanding</div><p data-testid="text-total-outstanding" className="mt-3 font-mono text-3xl font-bold">{money(totalDue)}</p><p className="mt-1 text-xs opacity-70">{state.customers.length} regular customers</p></div><Stat icon={Users} label="Customers" value={String(state.customers.length)} tint="teal" /><Stat icon={Banknote} label="Collected this month" value={money(state.sales.filter((s) => s.type === 'cash').reduce((a, s) => a + s.paid, 0))} tint="yellow" /></div><div className="mt-7 flex items-center justify-between"><div><h2 className="font-display text-2xl">People who trust you</h2><p className="text-xs text-muted-foreground">Tap an account to settle or review.</p></div><div className="relative w-40 sm:w-56"><Search size={15} className="absolute left-3 top-3 text-muted-foreground" /><input data-testid="input-customer-search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search names..." className="h-10 w-full rounded-lg border border-border bg-card pl-9 pr-2 text-xs" /></div></div><div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">{people.map((c) => <button key={c.id} data-testid={`card-customer-${c.id}`} onClick={() => { setPayment(''); setModal(c); }} className="rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-counter"><div className="flex items-center gap-3"><div className="grid h-11 w-11 place-items-center rounded-full bg-[#dbe6dd] text-sm font-bold text-primary">{c.initials}</div><div className="min-w-0"><p className="font-bold">{c.name}</p><p className="font-mono text-[10px] text-muted-foreground">{c.phone}</p></div><ChevronDown className="ml-auto text-muted-foreground" size={16} /></div><div className="mt-5 flex items-end justify-between"><div><p className="text-[10px] uppercase tracking-widest text-muted-foreground">Owes you</p><p data-testid={`text-balance-${c.id}`} className="mt-1 font-mono text-xl font-bold text-accent">{money(c.balance)}</p></div><span className="rounded-lg bg-accent/10 px-2 py-1 text-[10px] font-bold text-accent">{c.balance ? 'PAYMENT DUE' : 'CLEAR'}</span></div></button>)}</div>{!people.length && <div className="mt-4 rounded-2xl border border-border bg-card"><Empty icon={UserRound} title="No customers here" text="Add a customer or try a different search." /></div>}</div>{modal === 'new' && <Modal title="New customer" onClose={() => setModal(null)}><div className="space-y-3"><label className="block text-xs font-bold">Full name<input data-testid="input-customer-name" autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Bilal Ahmed" className="mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm" /></label><label className="block text-xs font-bold">Phone number<input data-testid="input-customer-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03xx xxx xxxx" className="mt-1 h-11 w-full rounded-lg border border-border px-3 text-sm" /></label><button data-testid="button-save-customer" onClick={saveCustomer} className="mt-2 w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground">Save customer</button></div></Modal>}{modal && modal !== 'new' && <Modal title={modal.name} onClose={() => setModal(null)}><div className="rounded-xl bg-accent/10 p-4"><p className="text-xs font-semibold text-muted-foreground">Current balance</p><p className="mt-1 font-mono text-3xl font-bold text-accent">{money(modal.balance)}</p></div><label className="mt-4 block text-xs font-bold">Payment received<input data-testid="input-customer-payment" autoFocus type="number" value={payment} onChange={(e) => setPayment(e.target.value)} placeholder="0" className="mt-1 h-12 w-full rounded-lg border border-border px-3 font-mono text-lg" /></label><button data-testid="button-record-payment" onClick={() => pay(modal)} className="mt-4 w-full rounded-xl bg-primary py-3 text-xs font-bold text-primary-foreground"><Banknote size={15} className="mr-2 inline" /> Record payment</button></Modal>}</>;
}

function Summary({ state }: { state: State }) {
  const [receipt, setReceipt] = useState<Sale | null>(null);
  const sales = state.sales.filter((s) => s.createdAt.slice(0, 10) === today()); const cash = sales.filter((s) => s.type === 'cash').reduce((a, s) => a + s.paid, 0); const udhaar = sales.filter((s) => s.type === 'udhaar').reduce((a, s) => a + s.total, 0); const revenue = sales.reduce((a, s) => a + s.total, 0); const items = sales.reduce((a, s) => a + s.items.reduce((x, i) => x + i.qty, 0), 0);
  return <><Topbar eyebrow="End of day" title="Today at a glance" action={<button data-testid="button-print-summary" onClick={() => window.print()} className="mt-1 flex items-center gap-2 rounded-xl border border-border bg-card px-3.5 py-2.5 text-sm font-bold text-primary"><Printer size={17} /> <span className="hidden sm:inline">Print summary</span></button>} /><div className="p-5 pb-24 md:p-9"><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4"><div className="rounded-2xl bg-primary p-5 text-primary-foreground shadow-counter sm:col-span-2"><p className="text-xs font-semibold opacity-75">Sales today</p><p data-testid="text-summary-sales" className="mt-2 font-mono text-4xl font-bold">{money(revenue)}</p><div className="mt-6 flex gap-8 text-xs"><span><b className="block text-lg font-mono">{sales.length}</b>transactions</span><span><b className="block text-lg font-mono">{items}</b>items sold</span></div></div><Stat icon={Banknote} label="Cash received" value={money(cash)} tint="yellow" /><Stat icon={CreditCard} label="Added to udhaar" value={money(udhaar)} tint="coral" /></div><div className="mt-7 grid gap-5 xl:grid-cols-[1.25fr_.75fr]"><section className="rounded-2xl border border-border bg-card shadow-sm"><div className="flex items-center justify-between border-b border-border p-5"><div><h2 className="font-display text-2xl">Recent sales</h2><p className="text-xs text-muted-foreground">Select a sale to view or print its bill.</p></div><span className="rounded-lg bg-secondary px-2.5 py-1 font-mono text-[10px] font-bold text-primary">{sales.length} TOTAL</span></div>{sales.length ? <div className="divide-y divide-border/70">{sales.slice(0, 8).map((s) => <button data-testid={`row-sale-${s.id}`} key={s.id} onClick={() => setReceipt(s)} className="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-muted/50"><div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${s.type === 'cash' ? 'bg-secondary text-primary' : 'bg-accent/10 text-accent'}`}>{s.type === 'cash' ? <Banknote size={16} /> : <CreditCard size={16} />}</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{s.items.map((i) => i.name).join(', ')}</p><p className="mt-1 font-mono text-[10px] text-muted-foreground">{new Date(s.createdAt).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' })} · {s.type === 'cash' ? 'Cash sale' : 'Udhaar'}</p></div><span className="font-mono text-sm font-bold">{money(s.total)}</span><Receipt size={15} className="text-muted-foreground" /></button>)}</div> : <Empty icon={FileText} title="No sales yet today" text="Your first sale will show up here." />}</section><section className="rounded-2xl border border-border bg-card p-5 shadow-sm"><h2 className="font-display text-2xl">Shelf watch</h2><p className="text-xs text-muted-foreground">Restock before the rush.</p><div className="mt-5 space-y-4">{state.products.filter((p) => p.stock < 10).sort((a, b) => a.stock - b.stock).map((p) => <div key={p.id} className="flex items-center gap-3"><div className={`grid h-9 w-9 place-items-center rounded-lg ${p.accent}`}><Package size={15} className="text-[#243348]/40" /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-bold">{p.name}</p><div className="mt-1 h-1.5 rounded-full bg-muted"><div className={`h-1.5 rounded-full ${p.stock < 5 ? 'bg-accent' : 'bg-[#d9ad3e]'}`} style={{ width: `${Math.min(p.stock * 10, 100)}%` }} /></div></div><span className="font-mono text-xs font-bold text-accent">{p.stock}</span></div>)}{!state.products.some((p) => p.stock < 10) && <p className="py-8 text-center text-sm text-muted-foreground">Everything is well stocked.</p>}</div></section></div></div>{receipt && <ReceiptModal sale={receipt} onClose={() => setReceipt(null)} />}</>;
}

function App() {
  const [state, setState] = useState<State>(loadState); const [toast, setToast] = useState('');
  useEffect(() => { localStorage.setItem('dukan-pos-state', JSON.stringify(state)); }, [state]);
  const notify = (message: string) => { setToast(message); window.setTimeout(() => setToast(''), 2600); };
  return <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Shell><Switch><Route path="/"><Counter state={state} setState={setState} notify={notify} /></Route><Route path="/inventory"><Inventory state={state} setState={setState} notify={notify} /></Route><Route path="/udhaar"><Udhaar state={state} setState={setState} notify={notify} /></Route><Route path="/summary"><Summary state={state} /></Route><Route><NotFound /></Route></Switch></Shell>{toast && <div data-testid="status-toast" className="no-print fixed bottom-20 left-1/2 z-[60] -translate-x-1/2 rounded-xl bg-primary px-4 py-3 text-xs font-bold text-primary-foreground shadow-xl md:bottom-6">{toast}</div>}</WouterRouter>;
}
export default App;