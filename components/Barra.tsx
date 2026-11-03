import Link from "next/link";

export default function Barra() {
  return (
    <header className="barra no-imprimir">
      <Link href="/" aria-label="Ordanza, ir a la agenda">
        <img src="/logo-ordanza.png" alt="Ordanza" />
      </Link>
      <nav aria-label="Menú">
        <Link href="/">Agenda</Link>
        <Link href="/caja">Caja</Link>
        <Link href="/reservar" target="_blank">Link de reservas</Link>
      </nav>
    </header>
  );
}
