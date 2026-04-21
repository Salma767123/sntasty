
import { Loader2 } from "lucide-react";

export default function Loading() {
    return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-[#556B2F]" />
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#556B2F] animate-pulse">
                    Loading Dashboard...
                </p>
            </div>
        </div>
    );
}
