"use client";

import { Leaf, ShieldCheck, Zap, Truck } from "lucide-react";

export default function TrustBadges() {
    const badges = [
        { icon: Leaf, label: "100% Organic", desc: "Certified ingredients", color: "green" },
        { icon: ShieldCheck, label: "Preservative Free", desc: "Pure & natural", color: "blue" },
        { icon: Zap, label: "Freshly Baked", desc: "Made daily", color: "yellow" },
        { icon: Truck, label: "Same Day Delivery", desc: "Fast & reliable", color: "purple" }
    ];

    const colorClasses = {
        green: "bg-green-50 text-green-600 group-hover:bg-green-600",
        blue: "bg-blue-50 text-blue-600 group-hover:bg-blue-600",
        yellow: "bg-yellow-50 text-yellow-600 group-hover:bg-yellow-600",
        purple: "bg-purple-50 text-purple-600 group-hover:bg-purple-600"
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12 border-y border-gray-200">
            {badges.map((b, i) => (
                <div key={i} className="flex flex-col items-center text-center group cursor-default">
                    <div className={`w-16 h-16 ${colorClasses[b.color as keyof typeof colorClasses]} rounded-xl flex items-center justify-center mb-3 transition-all duration-300 group-hover:text-white shadow-sm`}>
                        <b.icon size={28} strokeWidth={1.5} />
                    </div>
                    <h4 className="text-sm font-bold text-primary-dark mb-1">{b.label}</h4>
                    <p className="text-xs text-gray-500">{b.desc}</p>
                </div>
            ))}
        </div>
    );
}
