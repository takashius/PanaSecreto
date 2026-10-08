export default function AuthFooter() {
  return (
    <div className="mt-8 text-center text-xs text-gray-500 dark:text-gray-400">
      <p>© {new Date().getFullYear()} PanaSecreto. Todos los derechos reservados.</p>
      <p className="mt-1 text-[11px] text-gray-400">Plataforma Monorepo DevOps & Coolify</p>
    </div>
  );
}
