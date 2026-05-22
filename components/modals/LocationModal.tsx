"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

type Props = {
  onClose: () => void;
  onSave: (name: string, link: string) => void;
  initialName?: string;
  initialLink?: string;
};

export default function LocationModal({ onClose, onSave, initialName = "", initialLink = "" }: Props) {
  const [name, setName] = useState(initialName);
  const [link, setLink] = useState(initialLink);

  const extractEmbedSrc = (input: string) => {
    if (input.startsWith('<iframe')) {
      const match = input.match(/src="([^"]+)"/);
      return match ? match[1] : input;
    }
    return input;
  };

  const handleLinkChange = (value: string) => {
    setLink(extractEmbedSrc(value));
  };

  const handleSave = () => {
    onSave(name, link);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close location modal"
      />

      <div className="relative bg-white p-6 rounded-xl shadow-xl dark:bg-slate-900 dark:text-slate-100 w-[500px]">
        <h2 className="text-xl font-semibold mb-4">Set Location</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="location-name" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Location Name
            </label>
            <input
              id="location-name"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g., Main Parking Lot"
            />
          </div>

          <div>
            <label htmlFor="location-link" className="block text-sm font-medium text-slate-900 dark:text-slate-100">
              Google Maps Embed (Paste iframe HTML or link)
            </label>
            <input
              id="location-link"
              className="w-full rounded-md border border-slate-300 bg-white p-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-slate-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
              value={link}
              onChange={(event) => handleLinkChange(event.target.value)}
              placeholder="Paste iframe HTML or embed link"
            />
          </div>

          {link && (
            <div>
              <label className="block text-sm font-medium text-slate-900 dark:text-slate-100 mb-2">
                Preview
              </label>
              <iframe
                src={link}
                width="100%"
                height="200"
                style={{ border: 0 }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="rounded-md"
              />
            </div>
          )}
        </div>

        <div className="mt-6 flex gap-3">
          <Button className="flex-1 shadow-md active:shadow-inner active:translate-y-px bg-black text-white hover:bg-white hover:text-black hover:border-black border border-transparent dark:bg-white dark:text-black dark:hover:bg-slate-800 dark:hover:text-white dark:hover:border-slate-800 " onClick={handleSave}>
            Save Location
          </Button>
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}