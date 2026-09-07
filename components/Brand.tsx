import { LocalImage } from "./CloudImage";
import Link from "next/link";

export default function Brand({ priority = false }: { priority?: boolean }) {
  return (
    <Link className="brand" href="/" aria-label="Sankamithra Fireworks, home">
      <LocalImage
        src="/images/LogoFrame.png"
        alt=""
        width={74}
        height={52}
        fetchPriority={priority ? "high" : undefined}
      />
      <span className="brand__txt">
        <span className="brand__name">Sankamithra</span>
        <span className="brand__tag">Fireworks</span>
      </span>
    </Link>
  );
}
