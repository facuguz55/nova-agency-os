/**
 * Datos fiscales del EMISOR (Nova Agency) para las facturas.
 *
 * ⚠️  COMPLETAR con los datos reales del monotributista titular.
 *     Los valores con "XX" / "COMPLETAR" son placeholders visibles
 *     en el documento hasta que se reemplacen acá.
 *
 * Régimen: Monotributo → emite FACTURA C (no discrimina IVA).
 */

export const COMPANY = {
  /** Nombre comercial / de fantasía */
  tradeName: 'Nova Agency',
  /** Razón social = Apellido, Nombre del titular monotributista */
  legalName: 'COMPLETAR — Apellido, Nombre',
  /** CUIT del titular, formato XX-XXXXXXXX-X */
  cuit: 'XX-XXXXXXXX-X',
  /** Condición frente al IVA del emisor */
  taxCondition: 'Responsable Monotributo',
  /** Ingresos Brutos (N° de inscripción o "Exento" / "Convenio Multilateral") */
  grossIncome: 'COMPLETAR',
  /** Domicilio comercial */
  address: 'COMPLETAR — Calle 123',
  /** Localidad, Provincia */
  city: 'COMPLETAR — Ciudad, Provincia',
  /** Fecha de inicio de actividades (YYYY-MM-DD) */
  startDate: '',
  /** Punto de venta por defecto (5 dígitos) */
  pointOfSale: '00001',
  /** Contacto */
  email: 'hola@novaagency.info',
  instagram: '@novaagencytec',
  website: 'novaagency.info',
} as const

/** Etiqueta legible para el tipo de comprobante */
export const COMPROBANTE_LABEL: Record<string, string> = {
  A: 'FACTURA A',
  B: 'FACTURA B',
  C: 'FACTURA C',
  X: 'DOCUMENTO NO VÁLIDO COMO FACTURA',
}

/** Código AFIP del tipo de comprobante (informativo, va en el recuadro de la letra) */
export const COMPROBANTE_CODIGO: Record<string, string> = {
  A: '01', B: '06', C: '11', X: '00',
}

/**
 * Formatea el número fiscal del comprobante: PPPPP-NNNNNNNN
 * Deriva el correlativo del invoice_number interno (ej. "INV-0007" → 8 dígitos).
 */
export function formatComprobanteNumero(invoiceNumber: string | null | undefined, puntoVenta?: string | null): string {
  const pv = (puntoVenta || COMPANY.pointOfSale).padStart(5, '0')
  const correlativo = (invoiceNumber || '').replace(/\D/g, '')
  const num = correlativo ? correlativo.padStart(8, '0') : '00000000'
  return `${pv}-${num}`
}

/** ¿Los datos del emisor todavía tienen placeholders sin completar? */
export function companyDataIncompleta(): boolean {
  return (
    COMPANY.cuit.includes('X') ||
    COMPANY.legalName.startsWith('COMPLETAR') ||
    COMPANY.address.startsWith('COMPLETAR')
  )
}
