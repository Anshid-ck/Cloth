// src/pages/About.jsx
import React from 'react';
import { Leaf, Award, ShieldCheck, Zap } from 'lucide-react';

export default function About() {
    const images = {
        hero: 'C:/Users/Admin/.gemini/antigravity/brain/b774ee54-b069-485e-beae-2255d35839cb/about_hero_1769615125756.png',
        designer: 'C:/Users/Admin/.gemini/antigravity/brain/b774ee54-b069-485e-beae-2255d35839cb/about_story_designer_1769615220743.png',
        quality: 'C:/Users/Admin/.gemini/antigravity/brain/b774ee54-b069-485e-beae-2255d35839cb/about_fabric_quality_1769615748820.png'
    };

    const values = [
        {
            icon: <Award className="w-8 h-8 text-indigo-400" />,
            title: "Exquisite Craftsmanship",
            description: "Every piece in our collection is a testament to the art of tailoring, blending traditional techniques with modern innovation."
        },
        {
            icon: <Leaf className="w-8 h-8 text-emerald-400" />,
            title: "Sustainable Soul",
            description: "We believe in fashion that respects the earth. Our materials are ethically sourced and designed to last a lifetime."
        },
        {
            icon: <ShieldCheck className="w-8 h-8 text-blue-400" />,
            title: "Uncompromising Quality",
            description: "Premium fabrics and rigorous quality checks ensure that every garment you receive is nothing short of perfection."
        },
        {
            icon: <Zap className="w-8 h-8 text-amber-400" />,
            title: "Modern Vision",
            description: "We don't just follow trends; we set them. Our designs reflect the dynamic spirit of the modern individual."
        }
    ];

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-indigo-500/30">
            {/* Hero Section */}
            <section className="relative h-[80vh] flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 z-0">
                    <img
                        src={images.hero}
                        alt="Boutique Interior"
                        className="w-full h-full object-cover opacity-60 scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/20 to-[#050505]" />
                </div>

                <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
                    <h1 className="text-5xl sm:text-6xl md:text-8xl font-black mb-6 tracking-tighter animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        POGIEE <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">STUDIO</span>
                    </h1>
                    <p className="text-lg md:text-2xl text-gray-300 font-medium tracking-wide animate-in fade-in slide-in-from-bottom-12 duration-1000 delay-200">
                        Redefining the architecture of modern fashion.
                    </p>
                </div>
            </section>

            {/* Brand Story Section */}
            <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center">
                    <div className="space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">The Story Behind the Stitch</h2>
                        <div className="space-y-6 text-gray-400 text-lg leading-relaxed">
                            <p>
                                Founded in the heart of modern design, POGIEE began with a singular obsession: to create garments that feel as good as they look. We started as a small atelier focused on the delicate balance between structural integrity and fluid comfort.
                            </p>
                            <p>
                                Our philosophy is simple—fashion is a second skin. It should empower you, move with you, and tell your story without saying a word. Today, we continue that legacy, meticulously crafting each collection for the visionaries and the bold.
                            </p>
                        </div>
                        <div className="pt-4">
                            <div className="inline-flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 rounded-full text-sm font-bold tracking-widest uppercase hover:bg-white/10 transition-colors">
                                Our Heritage
                            </div>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute -inset-4 bg-indigo-500/10 blur-3xl rounded-full" />
                        <img
                            src={images.designer}
                            alt="Designer at work"
                            className="relative z-10 rounded-3xl border border-white/10 shadow-2xl"
                        />
                    </div>
                </div>
            </section>

            {/* Values Grid */}
            <section className="py-16 md:py-24 bg-white/[0.02] border-y border-white/5">
                <div className="max-w-7xl mx-auto px-4">
                    <div className="text-center mb-12 md:mb-20 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight">Our Core Pillars</h2>
                        <p className="text-gray-400 text-lg">The foundations on which we build every collection.</p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                        {values.map((v, i) => (
                            <div key={i} className="p-8 bg-white/[0.03] backdrop-blur-sm border border-white/10 rounded-3xl hover:border-indigo-500/50 transition-all group">
                                <div className="mb-6 transform group-hover:scale-110 transition-transform">{v.icon}</div>
                                <h3 className="text-xl font-bold mb-3">{v.title}</h3>
                                <p className="text-gray-400 leading-relaxed">{v.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Quality Section */}
            <section className="py-16 md:py-24 px-4 max-w-7xl mx-auto">
                <div className="grid md:grid-cols-2 gap-8 md:gap-16 items-center flex-row-reverse">
                    <div className="order-2 md:order-1">
                        <img
                            src={images.quality}
                            alt="Fabric Quality"
                            className="rounded-3xl border border-white/10 shadow-2xl grayscale hover:grayscale-0 transition-all duration-700"
                        />
                    </div>

                    <div className="order-1 md:order-2 space-y-8">
                        <h2 className="text-3xl md:text-4xl font-bold tracking-tight">Unrivaled Materials</h2>
                        <p className="text-gray-400 text-lg leading-relaxed">
                            We source only the finest natural fibers from around the globe. From hand-picked organic cotton to the softest ethically-sourced wool, our focus is on tactile excellence that stands the test of time.
                        </p>
                        <div className="grid grid-cols-2 gap-8 pt-4">
                            <div>
                                <p className="text-3xl font-black text-indigo-400">100%</p>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Ethical Sourcing</p>
                            </div>
                            <div>
                                <p className="text-3xl font-black text-purple-400">20+</p>
                                <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">Global Partners</p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 md:py-32 bg-gradient-to-t from-indigo-900/20 to-transparent">
                <div className="max-w-4xl mx-auto px-4 text-center space-y-8 md:space-y-10">
                    <h2 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-tight">
                        Wear Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">Story</span>.
                    </h2>
                    <p className="text-gray-400 text-xl max-w-2xl mx-auto">
                        Experience the fusion of modern luxury and effortless comfort in our latest collection.
                    </p>
                    <div className="pt-6">
                        <button
                            onClick={() => window.location.href = '/shop'}
                            className="px-10 py-5 bg-white text-black text-lg font-black rounded-full hover:bg-gray-200 transition-all shadow-xl shadow-white/5"
                        >
                            Explore Collection
                        </button>
                    </div>
                </div>
            </section>
        </div>
    );
}
