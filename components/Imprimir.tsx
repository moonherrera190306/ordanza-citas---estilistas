"use client";

export default function Imprimir() {
  return (
    <button className="btn btn-oro" type="button" onClick={() => window.print()}>
      Imprimir ticket
    </button>
  );
}
