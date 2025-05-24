const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="bg-white border-t border-neutral-200 py-4">
      <div className="container mx-auto px-4 text-center text-neutral-500 text-sm">
        © {currentYear} 材料残材管理システム
      </div>
    </footer>
  );
};

export default Footer;
