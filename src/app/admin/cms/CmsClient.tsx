"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Save, Loader2, Image as ImageIcon, X } from "lucide-react";
import toast from "react-hot-toast";

const INPUT_CLASS =
  "w-full rounded-xl border border-gray-200 bg-gray-50/80 text-gray-900 py-3 px-4 outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-shadow placeholder:text-gray-400 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none";

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <span className="text-sm font-semibold text-gray-700 mb-1.5 block">
      {children}
    </span>
  );
}

export default function CmsClient({
  initialSettings,
}: {
  initialSettings: any;
}) {
  const [settings, setSettings] = useState<any>(() => ({
    ...initialSettings,
    aboutUs: initialSettings?.aboutUs || {},
    ourStory: initialSettings?.ourStory || {},
    whyChooseUs: initialSettings?.whyChooseUs || { features: [] },
  }));
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"about" | "ourStory" | "whyChooseUs">("about");

  useEffect(() => {
    setSettings({
      ...initialSettings,
      aboutUs: initialSettings?.aboutUs || {},
      ourStory: initialSettings?.ourStory || {},
      whyChooseUs: initialSettings?.whyChooseUs || { features: [] },
    });
  }, [initialSettings]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("CMS settings saved successfully");
        const refreshRes = await fetch("/api/admin/settings");
        const refreshedData = await refreshRes.json();
        setSettings(refreshedData);
      } else {
        toast.error(data.error || "Failed to save settings");
      }
    } catch (e: any) {
      toast.error(e.message || "Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  const updateAboutUs = (field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      aboutUs: { ...(prev.aboutUs || {}), [field]: value },
    }));
  };

  const updateOurStory = (field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      ourStory: { ...(prev.ourStory || {}), [field]: value },
    }));
  };

  const updateWhyChooseUs = (field: string, value: string) => {
    setSettings((prev: any) => ({
      ...prev,
      whyChooseUs: { ...(prev.whyChooseUs || {}), [field]: value },
    }));
  };

  const updateWhyChooseUsFeature = (index: number, field: string, value: string) => {
    setSettings((prev: any) => {
      const whyChooseUs = prev.whyChooseUs || {};
      const features = [...(whyChooseUs.features || [])];
      if (!features[index]) features[index] = {};
      features[index][field] = value;
      return { ...prev, whyChooseUs: { ...whyChooseUs, features } };
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, section: "aboutUs" | "ourStory" | "whyChooseUs", field: string) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("File size must be less than 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        if (section === "aboutUs") updateAboutUs(field, reader.result as string);
        else if (section === "ourStory") updateOurStory(field, reader.result as string);
        else updateWhyChooseUs(field, reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const ImageUploader = ({ section, field, label, hint }: { section: "aboutUs" | "ourStory" | "whyChooseUs", field: string; label: string; hint?: string }) => (
    <div>
      <FieldLabel>{label}</FieldLabel>
      <div className="flex flex-col gap-3">
        {settings[section]?.[field] ? (
          <div className="relative group w-full max-w-sm aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-100 shadow-sm">
            <Image
              src={settings[section][field]}
              alt={label}
              className="w-full h-full object-cover"
              fill
              unoptimized
            />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <button
                type="button"
                onClick={() => section === "aboutUs" ? updateAboutUs(field, "") : 
                               section === "ourStory" ? updateOurStory(field, "") : updateWhyChooseUs(field, "")}
                className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        ) : (
          <label className="w-full max-w-sm aspect-video border-2 border-dashed border-gray-200 hover:border-accent rounded-xl flex flex-col items-center justify-center cursor-pointer bg-gray-50/50 hover:bg-white transition-colors">
            <ImageIcon size={24} className="text-gray-300 mb-2" />
            <p className="text-xs font-bold text-primary-dark">Upload Image</p>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleImageUpload(e, section, field)}
            />
          </label>
        )}
      </div>
      {hint && (
        <p className="text-[10px] text-gray-400 mt-1.5 flex items-center gap-1">
          <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#f8bf51]"></span>
          Recommended: {hint}
        </p>
      )}
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="bg-white p-5 sm:p-10 rounded-[1.5rem] sm:rounded-[3rem] shadow-sm border border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 sm:gap-6">
        <div>
          <h1 className="text-xl sm:text-3xl lg:text-4xl font-serif font-black text-primary-dark leading-none">
            Content Management (CMS)
          </h1>
          <p className="text-gray-400 mt-2 font-medium text-[10px] sm:text-sm">
            Manage your dynamic sections across the store.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full sm:w-auto bg-primary text-white px-8 py-3.5 sm:py-4 rounded-xl sm:rounded-2xl font-black uppercase tracking-widest text-[10px] sm:text-xs flex items-center justify-center gap-3 shadow-lg hover:bg-primary-dark transition-all disabled:opacity-50 active:scale-[0.98]"
        >
          {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 px-2">
        <button
          onClick={() => setActiveTab("about")}
          className={`px-6 py-2.5 rounded-full font-bold uppercase tracking-wide text-xs transition-all ${
            activeTab === "about"
              ? "bg-[#234d1b] text-white shadow-md shadow-[#234d1b]/20"
              : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
          }`}
        >
          About Us Page
        </button>
        <button
          onClick={() => setActiveTab("ourStory")}
          className={`px-6 py-2.5 rounded-full font-bold uppercase tracking-wide text-xs transition-all ${
            activeTab === "ourStory"
              ? "bg-[#234d1b] text-white shadow-md shadow-[#234d1b]/20"
              : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
          }`}
        >
          Home - Our Story
        </button>
        <button
          onClick={() => setActiveTab("whyChooseUs")}
          className={`px-6 py-2.5 rounded-full font-bold uppercase tracking-wide text-xs transition-all ${
            activeTab === "whyChooseUs"
              ? "bg-[#234d1b] text-white shadow-md shadow-[#234d1b]/20"
              : "bg-white text-gray-500 hover:bg-gray-50 border border-gray-100"
          }`}
        >
          Home - Why Choose Us
        </button>
      </div>

      <div className="bg-white rounded-[1.5rem] p-5 sm:p-10 shadow-sm border border-gray-50 space-y-8">
        {activeTab === "about" && (
          <>
        <h2 className="text-lg font-black text-primary-dark uppercase tracking-tight border-b pb-4">
          Hero Section
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <FieldLabel>Hero Title</FieldLabel>
              <input
                type="text"
                className={INPUT_CLASS}
                value={settings.aboutUs?.heroTitle || ""}
                onChange={(e) => updateAboutUs("heroTitle", e.target.value)}
                placeholder="Preserving the Soul of South India."
              />
            </div>
            <div>
              <FieldLabel>Hero Description</FieldLabel>
              <textarea
                className={`${INPUT_CLASS} min-h-[120px]`}
                value={settings.aboutUs?.heroDescription || ""}
                onChange={(e) => updateAboutUs("heroDescription", e.target.value)}
                placeholder="At Sai Nandhini Tasty World..."
              />
            </div>
            <div>
              <FieldLabel>Hero Floating Quote</FieldLabel>
              <textarea
                className={`${INPUT_CLASS} min-h-[80px]`}
                value={settings.aboutUs?.heroQuote || ""}
                onChange={(e) => updateAboutUs("heroQuote", e.target.value)}
                placeholder="The secret ingredient is always love..."
              />
            </div>
          </div>
          <ImageUploader section="aboutUs" field="heroImage" label="Hero Image" hint="800×800px, square format" />
        </div>

        <h2 className="text-lg font-black text-primary-dark uppercase tracking-tight border-b pb-4 pt-8">
          Our Philosophy Section
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6 md:col-span-2">
            <div>
              <FieldLabel>Story Title</FieldLabel>
              <input
                type="text"
                className={INPUT_CLASS}
                value={settings.aboutUs?.storyTitle || ""}
                onChange={(e) => updateAboutUs("storyTitle", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Story Description</FieldLabel>
              <textarea
                className={`${INPUT_CLASS} min-h-[100px]`}
                value={settings.aboutUs?.storyDescription || ""}
                onChange={(e) => updateAboutUs("storyDescription", e.target.value)}
              />
            </div>
          </div>
        </div>

        <h2 className="text-lg font-black text-primary-dark uppercase tracking-tight border-b pb-4 pt-8">
          Culinary Journey Section
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div>
              <FieldLabel>Journey Title</FieldLabel>
              <input
                type="text"
                className={INPUT_CLASS}
                value={settings.aboutUs?.journeyTitle || ""}
                onChange={(e) => updateAboutUs("journeyTitle", e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Journey Description</FieldLabel>
              <textarea
                className={`${INPUT_CLASS} min-h-[120px]`}
                value={settings.aboutUs?.journeyDescription || ""}
                onChange={(e) => updateAboutUs("journeyDescription", e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <FieldLabel>Happy Customers (Stat)</FieldLabel>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={settings.aboutUs?.happyCustomers || ""}
                  onChange={(e) => updateAboutUs("happyCustomers", e.target.value)}
                />
              </div>
              <div>
                <FieldLabel>Secret Recipes (Stat)</FieldLabel>
                <input
                  type="text"
                  className={INPUT_CLASS}
                  value={settings.aboutUs?.secretRecipes || ""}
                  onChange={(e) => updateAboutUs("secretRecipes", e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="space-y-6">
            <ImageUploader section="aboutUs" field="journeyImage1" label="Journey Image 1 (Square)" hint="600×600px, square format" />
            <ImageUploader section="aboutUs" field="journeyImage2" label="Journey Image 2 (Square)" hint="600×600px, square format" />
          </div>
        </div>
        </>
        )}

        {activeTab === "ourStory" && (
          <>
            <h2 className="text-lg font-black text-primary-dark uppercase tracking-tight border-b pb-4">
              Home Page - Our Story Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-6">
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={settings.ourStory?.title || ""}
                    onChange={(e) => updateOurStory("title", e.target.value)}
                    placeholder="Bringing the Authentic Taste of Madurai to Your Table."
                  />
                </div>
                <div>
                  <FieldLabel>Highlight Word</FieldLabel>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={settings.ourStory?.highlightWord || ""}
                    onChange={(e) => updateOurStory("highlightWord", e.target.value)}
                    placeholder="Taste of Madurai"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">This word from the title will be highlighted in gold italic</p>
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    className={`${INPUT_CLASS} min-h-[120px]`}
                    value={settings.ourStory?.description || ""}
                    onChange={(e) => updateOurStory("description", e.target.value)}
                  />
                </div>
                <div>
                  <FieldLabel>Years of Excellence Label (Badge)</FieldLabel>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={settings.ourStory?.yearsExcellence || ""}
                    onChange={(e) => updateOurStory("yearsExcellence", e.target.value)}
                    placeholder="25+"
                  />
                </div>
              </div>
              <div className="space-y-6">
                <ImageUploader section="ourStory" field="image" label="Section Image" hint="800×1000px, portrait (4:5 ratio)" />
              </div>
            </div>
          </>
        )}

        {activeTab === "whyChooseUs" && (
          <>
            <h2 className="text-lg font-black text-primary-dark uppercase tracking-tight border-b pb-4">
              Home Page - Why Choose Us Content
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
              <div className="space-y-6">
                <div>
                  <FieldLabel>Title</FieldLabel>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={settings.whyChooseUs?.title || ""}
                    onChange={(e) => updateWhyChooseUs("title", e.target.value)}
                    placeholder="No Shortcuts.\nNo Compromises."
                  />
                </div>
                <div>
                  <FieldLabel>Highlight Word</FieldLabel>
                  <input
                    type="text"
                    className={INPUT_CLASS}
                    value={settings.whyChooseUs?.highlightWord || ""}
                    onChange={(e) => updateWhyChooseUs("highlightWord", e.target.value)}
                    placeholder="Compromises."
                  />
                  <p className="text-xs text-gray-500 mt-1.5">This word from the title will be highlighted in gold italic</p>
                </div>

                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    className={`${INPUT_CLASS} min-h-[80px]`}
                    value={settings.whyChooseUs?.description || ""}
                    onChange={(e) => updateWhyChooseUs("description", e.target.value)}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Badge 1 Value (e.g. 25+)</FieldLabel>
                    <input
                      type="text"
                      className={INPUT_CLASS}
                      value={settings.whyChooseUs?.badge1Value || ""}
                      onChange={(e) => updateWhyChooseUs("badge1Value", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Badge 1 Label (e.g. Years of Heritage)</FieldLabel>
                    <input
                      type="text"
                      className={INPUT_CLASS}
                      value={settings.whyChooseUs?.badge1Label || ""}
                      onChange={(e) => updateWhyChooseUs("badge1Label", e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <FieldLabel>Badge 2 Value (e.g. 10K+)</FieldLabel>
                    <input
                      type="text"
                      className={INPUT_CLASS}
                      value={settings.whyChooseUs?.badge2Value || ""}
                      onChange={(e) => updateWhyChooseUs("badge2Value", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Badge 2 Label (e.g. Happy Customers)</FieldLabel>
                    <input
                      type="text"
                      className={INPUT_CLASS}
                      value={settings.whyChooseUs?.badge2Label || ""}
                      onChange={(e) => updateWhyChooseUs("badge2Label", e.target.value)}
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <ImageUploader section="whyChooseUs" field="image" label="Section Image" hint="800×1000px, portrait (4:5 ratio)" />
              </div>
            </div>

            <h2 className="text-lg font-black text-primary-dark uppercase tracking-tight border-b pb-4 pt-8">
              Why Choose Us Features
            </h2>
            <div className="space-y-6 pt-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="p-5 border border-gray-100 rounded-2xl space-y-4 bg-gray-50/30">
                  <div>
                    <FieldLabel>Feature {i + 1} Title</FieldLabel>
                    <input 
                      type="text"
                      className={INPUT_CLASS}
                      value={settings.whyChooseUs?.features?.[i]?.title || ""}
                      onChange={(e) => updateWhyChooseUsFeature(i, "title", e.target.value)}
                    />
                  </div>
                  <div>
                    <FieldLabel>Feature {i + 1} Description</FieldLabel>
                    <textarea 
                      className={INPUT_CLASS}
                      value={settings.whyChooseUs?.features?.[i]?.desc || ""}
                      onChange={(e) => updateWhyChooseUsFeature(i, "desc", e.target.value)}
                      rows={2}
                    />
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
