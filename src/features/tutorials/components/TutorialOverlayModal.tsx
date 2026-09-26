import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ChevronRight,
  ChevronDown,
  ArrowLeft,
  CirclePlay,
  RotateCcw,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { useTutorial } from '../context/TutorialContext';
import { usePublicTutorials } from '../hooks';
import {
  NAVIGATION_SECTIONS,
  TUTORIAL_FEATURES,
  getFeatureMeta,
} from '../featureRegistry';
import { getActionMeta } from '../actionRegistry';
import { NativeVideoPlayer } from './NativeVideoPlayer';
import type { PublicTutorial } from '../types';

function formatDuration(ms?: number | null): string {
  if (!ms || ms <= 0) return '';
  const totalSeconds = Math.round(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
}

export const TutorialOverlayModal: React.FC = () => {
  const {
    isOpen,
    selectedTutorial,
    expandedFeatureKey,
    closeTutorial,
    selectTutorial,
    backToList,
    toggleFeatureExpanded,
  } = useTutorial();

  const navigate = useNavigate();
  const modalRef = useRef<HTMLDivElement>(null);
  const { data: tutorials, isLoading, isError, refetch } = usePublicTutorials();

  // Close on Escape & Lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeTutorial();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, closeTutorial]);

  if (!isOpen) return null;

  // Group published tutorials by feature_key
  const groupedTutorials: Record<string, PublicTutorial[]> = {};
  if (tutorials) {
    for (const t of tutorials) {
      if (!groupedTutorials[t.feature_key]) {
        groupedTutorials[t.feature_key] = [];
      }
      groupedTutorials[t.feature_key]!.push(t);
    }
  }

  // Active features that have at least 1 tutorial
  const activeFeatures = TUTORIAL_FEATURES.filter(
    (f) => (groupedTutorials[f.key]?.length ?? 0) > 0
  );

  const currentFeatureMeta = selectedTutorial
    ? getFeatureMeta(selectedTutorial.feature_key)
    : null;

  const currentActionMeta = selectedTutorial?.action_key
    ? getActionMeta(selectedTutorial.action_key)
    : null;

  const handleActionClick = () => {
    if (currentActionMeta) {
      closeTutorial();
      navigate(currentActionMeta.path);
    }
  };

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="tutorial-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
    >
      {/* Dimmed & blurred backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeTutorial}
        aria-hidden="true"
      />

      {/* Portrait phone-sized panel */}
      <div
        ref={modalRef}
        className="relative z-10 w-full max-w-[420px] max-h-[88dvh] sm:max-h-[85vh] bg-white rounded-3xl shadow-2xl border border-stone-200/80 flex flex-col overflow-hidden text-brand-text motion-safe:transition-all motion-safe:duration-200 motion-safe:scale-100"
      >
        {/* ========================================================= */}
        {/* VIEW MODE 1: FEATURE LIST */}
        {/* ========================================================= */}
        {!selectedTutorial ? (
          <>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-brand-border/40 bg-gradient-to-b from-brand-soft-pink/40 to-transparent">
              <div>
                <div className="flex items-center gap-2">
                  <CirclePlay className="h-5 w-5 text-brand-burgundy" />
                  <h2
                    id="tutorial-modal-title"
                    className="text-lg font-bold text-brand-burgundy font-outfit"
                  >
                    Tutorial
                  </h2>
                </div>
                <p className="text-xs text-brand-text-secondary mt-0.5">
                  Tìm hiểu nhanh các tính năng của Chợ PTITers
                </p>
              </div>

              <button
                type="button"
                onClick={closeTutorial}
                className="h-8 w-8 rounded-full flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-black/5 transition-colors cursor-pointer"
                aria-label="Đóng Tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Scrollable list body: Grouped by Navigation Sections */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 space-y-3">
              {isLoading && (
                <div className="space-y-3 py-4">
                  {[1, 2, 3, 4].map((n) => (
                    <div
                      key={n}
                      className="h-14 bg-stone-100 animate-pulse rounded-2xl"
                    />
                  ))}
                </div>
              )}

              {isError && (
                <div className="flex flex-col items-center justify-center p-6 text-center">
                  <p className="text-sm font-semibold text-brand-price">
                    Không thể tải danh sách Tutorial lúc này
                  </p>
                  <p className="text-xs text-brand-text-muted mt-1 mb-3">
                    Vui lòng kiểm tra lại mạng hoặc thử lại.
                  </p>
                  <button
                    type="button"
                    onClick={() => refetch()}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-brand-burgundy text-white px-3.5 py-1.5 text-xs font-medium hover:bg-brand-burgundy/90 transition-colors cursor-pointer"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    <span>Thử lại</span>
                  </button>
                </div>
              )}

              {!isLoading && !isError && activeFeatures.length === 0 && (
                <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                  <div className="h-12 w-12 rounded-full bg-brand-soft-pink flex items-center justify-center text-brand-burgundy mb-3">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-semibold text-brand-text">
                    Tutorial đang được cập nhật
                  </h3>
                  <p className="text-xs text-brand-text-secondary mt-1 max-w-[260px]">
                    Chúng mình đang chuẩn bị các video hướng dẫn chi tiết nhất. Bạn vui lòng quay lại sau nhé!
                  </p>
                </div>
              )}

              {!isLoading &&
                !isError &&
                NAVIGATION_SECTIONS.map((section) => {
                  const sectionFeatures = TUTORIAL_FEATURES.filter(
                    (f) => f.section === section.label
                  );
                  const activeSectionFeatures = sectionFeatures.filter(
                    (f) => (groupedTutorials[f.key]?.length ?? 0) > 0
                  );

                  if (activeSectionFeatures.length === 0) {
                    return null;
                  }

                  return (
                    <div key={section.id} className="space-y-2">
                      {/* Navigation Section Title (omitted for Trang chủ if single standalone) */}
                      {section.label !== 'Trang chủ' && (
                        <span className="px-1 text-[11px] font-semibold text-brand-text-muted uppercase tracking-wider block pt-1">
                          {section.label}
                        </span>
                      )}

                      {/* Navigation Items inside this Section */}
                      <div className="space-y-2">
                        {activeSectionFeatures.map((feature) => {
                          const featureTutorials = groupedTutorials[feature.key] || [];
                          const isExpanded = expandedFeatureKey === feature.key;
                          const Icon = feature.icon;

                          return (
                            <div
                              key={feature.key}
                              className="border border-brand-border/60 rounded-2xl overflow-hidden transition-colors bg-white shadow-xs"
                            >
                              {/* Feature Accordion Header Button */}
                              <button
                                type="button"
                                onClick={() => toggleFeatureExpanded(feature.key)}
                                className={`w-full flex items-center justify-between px-3.5 py-3 text-left transition-colors cursor-pointer ${
                                  isExpanded
                                    ? 'bg-brand-soft-pink/50 font-semibold text-brand-burgundy'
                                    : 'hover:bg-stone-50 font-medium text-brand-text'
                                }`}
                                aria-expanded={isExpanded}
                              >
                                <div className="flex items-center gap-2.5 min-w-0">
                                  <div
                                    className={`h-8 w-8 rounded-xl flex items-center justify-center shrink-0 ${
                                      isExpanded
                                        ? 'bg-brand-burgundy text-white'
                                        : 'bg-brand-soft-pink text-brand-burgundy'
                                    }`}
                                  >
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <div className="min-w-0">
                                    <span className="text-sm block truncate">
                                      {feature.label}
                                    </span>
                                    <span className="text-[11px] text-brand-text-muted">
                                      {featureTutorials.length} hướng dẫn
                                    </span>
                                  </div>
                                </div>

                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-brand-burgundy shrink-0 ml-2" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-brand-text-muted shrink-0 ml-2" />
                                )}
                              </button>

                              {/* Expanded Children List (Vertical) */}
                              {isExpanded && (
                                <div className="divide-y divide-brand-border/40 bg-stone-50/50">
                                  {featureTutorials.map((tut) => (
                                    <button
                                      key={tut.tutorial_id}
                                      type="button"
                                      onClick={() => selectTutorial(tut)}
                                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left hover:bg-brand-soft-pink/40 transition-colors cursor-pointer group"
                                    >
                                      {/* Derived Thumbnail from video */}
                                      <div className="relative h-12 w-9 rounded-lg overflow-hidden bg-stone-800 shrink-0 flex items-center justify-center border border-brand-border/60">
                                        {tut.thumbnail_url ? (
                                          <img
                                            src={tut.thumbnail_url}
                                            alt={tut.title}
                                            className="h-full w-full object-cover"
                                            loading="lazy"
                                          />
                                        ) : (
                                          <CirclePlay className="h-4 w-4 text-white/70 group-hover:text-white" />
                                        )}
                                      </div>

                                      {/* Title, description & duration */}
                                      <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-semibold text-brand-text group-hover:text-brand-burgundy line-clamp-2 break-words">
                                          {tut.title}
                                        </h4>
                                        {tut.description && (
                                          <p className="text-[11px] text-brand-text-secondary line-clamp-1 mt-0.5 break-words">
                                            {tut.description}
                                          </p>
                                        )}
                                        {tut.duration_ms && (
                                          <span className="inline-block text-[10px] text-brand-text-muted mt-0.5">
                                            {formatDuration(tut.duration_ms)}
                                          </span>
                                        )}
                                      </div>

                                      {/* Play chevron */}
                                      <CirclePlay className="h-4 w-4 text-brand-text-muted group-hover:text-brand-burgundy shrink-0" />
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
            </div>
          </>
        ) : (
          /* ========================================================= */
          /* VIEW MODE 2: VIDEO MODE */
          /* ========================================================= */
          <>
            {/* Header with Back button and Close button */}
            <div className="flex items-center justify-between px-4 py-3.5 border-b border-brand-border/40 bg-white">
              <button
                type="button"
                onClick={backToList}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-burgundy hover:text-brand-burgundy/80 transition-colors cursor-pointer py-1 px-2 rounded-lg hover:bg-brand-soft-pink/50 max-w-[200px]"
                aria-label="Quay lại danh sách hướng dẫn"
              >
                <ArrowLeft className="h-4 w-4 shrink-0" />
                <span className="truncate">{currentFeatureMeta?.label || 'Quay lại'}</span>
              </button>

              <button
                type="button"
                onClick={closeTutorial}
                className="h-8 w-8 rounded-full flex items-center justify-center text-brand-text-muted hover:text-brand-text hover:bg-black/5 transition-colors cursor-pointer shrink-0"
                aria-label="Đóng Tutorial"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Video + Details body */}
            <div className="flex-1 overflow-y-auto overscroll-contain p-4 flex flex-col items-center">
              <h3 className="text-sm sm:text-base font-bold text-brand-text text-center mb-3 max-w-[340px] px-2 break-words leading-snug">
                {selectedTutorial.title}
              </h3>

              {/* 9:16 Native Video Player with derived thumbnail poster */}
              <NativeVideoPlayer
                videoUrl={selectedTutorial.video_url}
                posterUrl={selectedTutorial.thumbnail_url}
                title={selectedTutorial.title}
              />

              {/* Description */}
              {selectedTutorial.description && (
                <p className="text-xs text-brand-text-secondary text-center mt-3 max-w-[340px] px-2 leading-relaxed">
                  {selectedTutorial.description}
                </p>
              )}

              {/* Action Button ("Làm ngay") */}
              {currentActionMeta && (
                <div className="w-full max-w-[340px] mt-4 pt-2">
                  <button
                    type="button"
                    onClick={handleActionClick}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-brand-burgundy hover:bg-brand-burgundy/90 text-white font-semibold text-xs sm:text-sm py-3 px-4 shadow-sm transition-all cursor-pointer"
                  >
                    <span>{currentActionMeta.label}</span>
                    <ExternalLink className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
};
