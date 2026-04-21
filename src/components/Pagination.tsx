"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems: number;
  itemsPerPage: number;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  itemsPerPage,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const getPageNumbers = () => {
    const pages: (number | "...")[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push("...");
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  };

  return (
    <div className="bg-white rounded-2xl sm:rounded-[2rem] border border-gray-100 shadow-sm px-4 sm:px-8 py-4 sm:py-5 mt-6 mb-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-[10px] sm:text-[11px] font-black text-gray-400 uppercase tracking-[0.15em] order-2 sm:order-1">
          Showing {startItem}–{endItem} of {totalItems}
        </p>
        <div className="flex items-center gap-2 order-1 sm:order-2">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#234d1b] hover:text-white disabled:opacity-20 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            <ChevronLeft size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            {getPageNumbers().map((page, i) =>
              page === "..." ? (
                <span
                  key={`dots-${i}`}
                  className="w-6 text-center text-gray-300 text-xs font-black select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => onPageChange(page as number)}
                  className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl text-xs font-black transition-all ${
                    currentPage === page
                      ? "bg-[#234d1b] text-white shadow-lg shadow-[#234d1b]/20 scale-110"
                      : "bg-gray-50 text-gray-400 hover:bg-[#234d1b]/10 hover:text-[#234d1b]"
                  }`}
                >
                  {page}
                </button>
              ),
            )}
          </div>
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
            className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-[#234d1b] hover:text-white disabled:opacity-20 disabled:hover:bg-gray-50 disabled:hover:text-gray-400 disabled:cursor-not-allowed transition-all"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export function usePagination<T>(items: T[], itemsPerPage: number = 15) {
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const paginatedItems = items.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    currentPage,
    totalPages,
    paginatedItems,
    setCurrentPage,
    totalItems: items.length,
    itemsPerPage,
  };
}
