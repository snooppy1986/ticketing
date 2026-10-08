import Link from "next/link";

export default ({ currentUser }) => {
  const links = [
    !currentUser && { label: "Sign Up", href: "/auth/signup" },
    !currentUser && { label: "Sign In", href: "/auth/signin" },
    currentUser && { label: "Sell Tickets", href: "/tickets/new" },
    currentUser && { label: "My Orders", href: "/orders" },
    currentUser && { label: "Sign Out", href: "/auth/signout" },
  ]
    .filter((link) => link)
    .map(({ label, href }) => (
      <li key={href} className="nav-item">
        <Link href={href} className="nav-link">
          {label}
        </Link>
      </li>
    ));

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light mb-2">
      <div className="container-fluid">
        <Link href="/" className="navbar-brand">
          GitTix
        </Link>
        <ul className="navbar-nav ms-auto">{links}</ul>
      </div>
    </nav>
  );
};
