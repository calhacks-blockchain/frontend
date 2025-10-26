'use client';

import Image from 'next/image';
import { ExternalLink, Twitter, Globe, MessageCircle, CheckCircle, Clock, Circle } from 'lucide-react';
import { Tweet } from 'react-tweet';
import { StartupData } from '@/types/startup';
import { formatCurrency, getPriceChangeColor } from '@/lib/format-utils';
import { cn } from '@/lib/utils';
import { Carousel } from '@/components/ui/carousel';

interface CompanyTabProps {
  startup: StartupData;
}

export function CompanyTab({ startup }: CompanyTabProps) {
  return (
    <div className="h-full overflow-y-auto">
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        {/* Hero Section - ProductHunt Style */}
        <div className="mb-8">
          <div className="flex items-start gap-6 mb-6">
            {/* Company Logo */}
            <div className="relative w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0 border border-border">
              <Image
                src={startup.logo}
                alt={startup.name}
                fill
                className="object-cover"
                unoptimized
              />
            </div>

            {/* Name, Tagline, and Actions */}
            <div className="flex-1 min-w-0">
              <h1 className="text-3xl font-bold mb-2">{startup.name}</h1>
              <p className="text-lg text-muted-foreground mb-4">{startup.tagline}</p>
              
              {/* Visit Website Button */}
              {startup.website && (
                <a
                  href={startup.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
                >
                  <Globe size={18} />
                  Visit Website
                  <ExternalLink size={16} />
                </a>
              )}
            </div>
          </div>

          {/* Social Links */}
          {(startup.twitter || startup.discord || startup.telegram) && (
            <div className="flex gap-3">
              {startup.twitter && (
                <a
                  href={startup.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-primary/50 rounded-lg transition-colors text-sm"
                >
                  <Twitter size={16} />
                  Twitter
                </a>
              )}
              {startup.discord && (
                <a
                  href={startup.discord}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-card border border-border hover:border-primary/50 rounded-lg transition-colors text-sm"
                >
                  <MessageCircle size={16} />
                  Discord
                </a>
              )}
            </div>
          )}
        </div>

        {/* About Section */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">About</h2>
          <p className="text-foreground/90 leading-relaxed mb-6">
            {startup.elevatorPitch}
          </p>
        </section>

        {/* Company Slider */}
        {startup.sliderImages && startup.sliderImages.length > 0 && (
          <section className="mb-10">
            <Carousel
              autoPlayInterval={6000}
              className="w-full"
            >
              {startup.sliderImages.map((image, index) => (
                <div key={index} className="relative w-full h-[400px] bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={image}
                    alt={`Company showcase ${index + 1}`}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ))}
            </Carousel>
          </section>
        )}

        {/* Latest Updates - Real Tweets from X */}
        {startup.tweetIds && startup.tweetIds.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-5">Latest Updates</h2>
            <div className="space-y-4">
              {startup.tweetIds.map((tweetId) => (
                <div key={tweetId} className="flex justify-center">
                  <div className="w-full max-w-xl">
                    <Tweet id={tweetId} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* The Problem */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">The Problem</h2>
          <p className="text-foreground/80 leading-relaxed">
            {startup.problem}
          </p>
        </section>

        {/* Our Solution */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Our Solution</h2>
          <p className="text-foreground/80 leading-relaxed">
            {startup.solution}
          </p>
        </section>

        {/* Why Now */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-4">Why Now?</h2>
          <p className="text-foreground/80 leading-relaxed">
            {startup.whyNow}
          </p>
        </section>

        {/* Traction */}
        {startup.traction && startup.traction.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xl font-bold mb-5">Traction</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {startup.traction.map((metric, index) => (
                <div key={index} className="p-5 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
                  <div className="text-sm text-muted-foreground mb-2">{metric.label}</div>
                  <div className="text-2xl font-bold mb-1">{metric.value}</div>
                  {metric.change !== undefined && (
                    <div className={cn('text-sm font-medium', getPriceChangeColor(metric.change))}>
                      {metric.change > 0 ? '+' : ''}{metric.change}% growth
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Team */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-5">Team</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {startup.team.map((member, index) => (
              <div key={index} className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-muted flex-shrink-0">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-semibold text-sm">{member.name}</h4>
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-primary transition-colors"
                      >
                        <ExternalLink size={14} />
                      </a>
                    )}
                  </div>
                  <p className="text-xs text-primary mb-1.5">{member.role}</p>
                  {member.bio && (
                    <p className="text-xs text-muted-foreground line-clamp-2">{member.bio}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Roadmap */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-5">Roadmap</h2>
          <div className="space-y-3">
            {startup.roadmap.map((item, index) => (
              <div key={index} className="flex gap-4 p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors">
                <div className="flex-shrink-0 pt-1">
                  {item.status === 'completed' && (
                    <CheckCircle size={20} className="text-green-500" />
                  )}
                  {item.status === 'in-progress' && (
                    <Clock size={20} className="text-yellow-500" />
                  )}
                  {item.status === 'planned' && (
                    <Circle size={20} className="text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-primary">{item.quarter}</span>
                    <h4 className="font-semibold text-sm">{item.title}</h4>
                  </div>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Token Distribution */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-5">Token Distribution</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Distribution List */}
            <div className="space-y-2.5">
              {startup.tokenDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-card border border-border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div
                      className="w-4 h-4 rounded"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm font-medium">{item.category}</span>
                  </div>
                  <span className="text-sm font-semibold">{item.percentage}%</span>
                </div>
              ))}
            </div>
            
            {/* Visual Pie Chart */}
            <div className="flex items-center justify-center">
              <div className="w-48 h-48 rounded-full overflow-hidden relative shadow-lg">
                {startup.tokenDistribution.map((item, index) => {
                  const prevTotal = startup.tokenDistribution
                    .slice(0, index)
                    .reduce((sum, i) => sum + i.percentage, 0);
                  const rotation = (prevTotal / 100) * 360;
                  const segmentSize = (item.percentage / 100) * 360;
                  
                  return (
                    <div
                      key={index}
                      className="absolute inset-0"
                      style={{
                        background: `conic-gradient(from ${rotation}deg, ${item.color} 0deg, ${item.color} ${segmentSize}deg, transparent ${segmentSize}deg)`
                      }}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Use of Funds */}
        <section className="mb-10">
          <h2 className="text-xl font-bold mb-5">Use of Funds</h2>
          <div className="space-y-4">
            {startup.useOfFunds.map((item, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{item.category}</span>
                  <span className="text-sm font-semibold">
                    {item.percentage}% ({formatCurrency(item.amount, 0)})
                  </span>
                </div>
                <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-500"
                    style={{ width: `${item.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
