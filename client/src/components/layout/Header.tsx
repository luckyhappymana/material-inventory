import { useState } from "react";
import { Link, useLocation } from "wouter";

const Header = () => {
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (path: string) => location === path;

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="bg-white border-b border-neutral-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center">
          <i className="material-icons text-primary mr-2">inventory_2</i>
          <h1 className="text-xl font-bold">材料残材管理システム</h1>
        </div>
        <div className="hidden md:flex items-center space-x-4">
          <Link 
            to="/" 
            className={`px-3 py-2 font-medium ${isActive("/") 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-600 hover:text-primary"}`}
          >
            在庫一覧
          </Link>

          <Link 
            to="/stats" 
            className={`px-3 py-2 font-medium ${isActive("/stats") 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-600 hover:text-primary"}`}
          >
            統計
          </Link>
          <Link 
            to="/material-types" 
            className={`px-3 py-2 font-medium ${isActive("/material-types") 
              ? "text-primary border-b-2 border-primary" 
              : "text-neutral-600 hover:text-primary"}`}
          >
            材質管理
          </Link>
        </div>
        <button 
          onClick={toggleMobileMenu}
          className="md:hidden text-neutral-600"
        >
          <i className="material-icons">{mobileMenuOpen ? "close" : "menu"}</i>
        </button>
      </div>
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-neutral-200 py-2">
          <div className="container mx-auto px-4 flex flex-col space-y-2">
            <Link 
              to="/" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 font-medium ${isActive("/") 
                ? "text-primary" 
                : "text-neutral-600"}`}
            >
              在庫一覧
            </Link>

            <Link 
              to="/stats" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 font-medium ${isActive("/stats") 
                ? "text-primary" 
                : "text-neutral-600"}`}
            >
              統計
            </Link>
            <Link 
              to="/material-types" 
              onClick={() => setMobileMenuOpen(false)}
              className={`px-3 py-2 font-medium ${isActive("/material-types") 
                ? "text-primary" 
                : "text-neutral-600"}`}
            >
              材質管理
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
