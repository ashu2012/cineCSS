import React from 'react';
import { ExternalLink, ArrowRight } from 'lucide-react';

const Documentation: React.FC = () => {
  return (
    <div className="w-full h-full bg-[#0d1117] overflow-y-auto custom-scrollbar">
      <div className="max-w-3xl mx-auto px-6 py-12 md:py-20 text-neutral-300">
        
        {/* Header */}
        <div className="border-b border-neutral-800 pb-8 mb-10">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">CineCSS</h1>
          <p className="text-xl text-neutral-400">Cinematic Pure CSS Animations & Commerce Interactions</p>
        </div>

        {/* Content */}
        <div className="space-y-12">
          
          <section>
            <p className="leading-relaxed text-lg mb-6">
              CineCSS is a collection of iconic movie scenes and interactive experiences recreated using React, Tailwind CSS, and pure CSS animations. It demonstrates the power of modern web technologies to create immersive, lightweight, and performant visual narratives without heavy video assets.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
              The Daily Code: Revolutionizing Digital Storefronts
            </h2>
            <p className="mb-6 leading-relaxed">
              The core feature of this project, <strong>"The Daily Code"</strong> (and its flying variant), showcases how tactile, folding interfaces can transform web and mobile applications.
            </p>

            <div className="grid gap-6 md:grid-cols-2">
              <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-700/50">
                <h3 className="text-lg font-semibold text-white mb-2">1. Emotional Commerce</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Transform the mundane "Checkout" click into a memorable event. Imagine a user completing a purchase, and instead of a simple spinner, their receipt folds into a paper airplane and flies off to a fulfillment center map. This creates a moment of delight that enhances brand recall.
                </p>
              </div>

              <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-700/50">
                <h3 className="text-lg font-semibold text-white mb-2">2. Editorial Storytelling</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Replace infinite scrolls with interactive, page-turning newspapers. This format allows for dense information (specs, reviews, stories) to live in compact spaces, revealed through natural gestures rather than endless vertical scrolling.
                </p>
              </div>

              <div className="bg-neutral-800/50 p-6 rounded-xl border border-neutral-700/50 md:col-span-2">
                <h3 className="text-lg font-semibold text-white mb-2">3. Performance</h3>
                <p className="text-sm text-neutral-400 leading-relaxed">
                  Unlike video backgrounds which are bandwidth-heavy and CPU-intensive, these scenes are built with DOM elements and CSS transforms. They remain crisp at any resolution and load instantly, ensuring a smooth experience even on mobile data connections.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-green-500 rounded-full"></span>
              Interactive Demos & Sharing
            </h2>
            <p className="mb-6">
              You can share specific scenes with external audiences using URL query parameters. This allows product teams to link directly to a specific "mood" or feature demonstration.
            </p>

            <div className="space-y-4">
              <a href="/?scene=NEWSPAPER" className="group block bg-neutral-900 border border-neutral-800 hover:border-blue-500 p-4 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-400 text-sm mb-1">?scene=NEWSPAPER</span>
                  <ArrowRight size={16} className="text-neutral-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h4 className="font-bold text-white">Standard Newspaper Interaction</h4>
                <p className="text-sm text-neutral-500">Experience the tactile page-turning engine.</p>
              </a>

              <a href="/?scene=COMMERCE_SHOWCASE" className="group block bg-neutral-900 border border-neutral-800 hover:border-blue-500 p-4 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-400 text-sm mb-1">?scene=COMMERCE_SHOWCASE</span>
                  <ArrowRight size={16} className="text-neutral-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h4 className="font-bold text-white">Commerce Showcase Write-up</h4>
                <p className="text-sm text-neutral-500">View the dedicated write-up on how these features apply to buying experiences.</p>
              </a>

              <a href="/?scene=NEWSPAPER_AIRPLANE" className="group block bg-neutral-900 border border-neutral-800 hover:border-blue-500 p-4 rounded-lg transition-colors">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-blue-400 text-sm mb-1">?scene=NEWSPAPER_AIRPLANE</span>
                  <ArrowRight size={16} className="text-neutral-500 group-hover:text-blue-500 transition-colors" />
                </div>
                <h4 className="font-bold text-white">Interactive Folding</h4>
                <p className="text-sm text-neutral-500">Edit the content and send it flying.</p>
              </a>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <span className="w-1 h-6 bg-purple-500 rounded-full"></span>
              Tech Stack
            </h2>
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {['React 19', 'Tailwind CSS', 'Lucide Icons', 'Google GenAI SDK', 'PDF.js'].map((item) => (
                <li key={item} className="bg-neutral-800 px-4 py-2 rounded-md text-sm text-neutral-300 font-mono border border-neutral-700 text-center">
                  {item}
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-20 pt-8 border-t border-neutral-800 flex justify-between items-center text-xs text-neutral-500 font-mono">
            <span>README.md loaded</span>
            <span>v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default Documentation;