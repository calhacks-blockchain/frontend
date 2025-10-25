'use client';

import { Lock, FileText, Download, Users, TrendingUp } from 'lucide-react';
import { StartupData } from '@/types/startup';
import { formatCurrency } from '@/lib/format-utils';
import { Button } from '@/components/ui/button';

interface DocumentsTabProps {
  startup: StartupData;
}

export function DocumentsTab({ startup }: DocumentsTabProps) {
  const isGraduated = startup.hasGraduated;
  const remainingAmount = startup.goal - startup.raised;
  const progressPercentage = (startup.raised / startup.goal) * 100;

  if (!isGraduated) {
    return (
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="text-center">
          {/* Lock Icon */}
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-muted/50 mb-6">
            <Lock size={48} className="text-muted-foreground" />
          </div>

          {/* Heading */}
          <h2 className="text-3xl font-bold mb-4">Documents Locked</h2>
          <p className="text-lg text-muted-foreground mb-8">
            Legal documents and SAFE agreements will be available once this startup reaches their graduation goal.
          </p>

          {/* Progress Card */}
          <div className="bg-card border border-border rounded-lg p-8 mb-8">
            <div className="mb-6">
              <div className="text-sm text-muted-foreground mb-2">Fundraising Progress</div>
              <div className="text-4xl font-bold mb-2">
                {progressPercentage.toFixed(1)}%
              </div>
              <div className="text-muted-foreground">
                {formatCurrency(startup.raised, 0)} raised of {formatCurrency(startup.goal, 0)} goal
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-3 bg-muted rounded-full overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-primary to-blue-400 transition-all duration-500"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            <div className="text-lg font-semibold text-primary">
              {formatCurrency(remainingAmount, 0)} remaining to unlock documents
            </div>
          </div>

          {/* What You'll Get */}
          <div className="text-left bg-muted/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">What you&apos;ll get after graduation:</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">AI-Generated SAFE Agreement</div>
                  <div className="text-sm text-muted-foreground">
                    Customized Simple Agreement for Future Equity based on fundraise terms
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <Users size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Cap Table Access</div>
                  <div className="text-sm text-muted-foreground">
                    View your ownership percentage and position among investors
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <TrendingUp size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Investor Certificate</div>
                  <div className="text-sm text-muted-foreground">
                    Official documentation of your {startup.equityOffered}% equity stake
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <FileText size={20} className="text-primary mt-0.5 flex-shrink-0" />
                <div>
                  <div className="font-medium">Transaction History</div>
                  <div className="text-sm text-muted-foreground">
                    Complete record of all your token purchases and conversions
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Graduated state - show available documents
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Success Banner */}
      <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-6 mb-8">
        <div className="flex items-start gap-4">
          <div className="text-4xl">🎉</div>
          <div>
            <h2 className="text-2xl font-bold text-green-500 mb-2">
              Congratulations! This startup has graduated!
            </h2>
            <p className="text-foreground/80">
              The fundraising goal has been reached. All tokens have been converted to {startup.equityOffered}% 
              equity via SAFE agreements. Your legal documents are now available below.
            </p>
          </div>
        </div>
      </div>

      {/* Documents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SAFE Agreement */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
            <Button size="sm" variant="outline">
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">SAFE Agreement</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Your Simple Agreement for Future Equity, generated automatically based on the fundraise terms.
          </p>
          <div className="text-xs text-muted-foreground">
            Generated on {startup.created.toLocaleDateString()} • PDF • 247 KB
          </div>
        </div>

        {/* Cap Table */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <Users size={24} className="text-primary" />
            </div>
            <Button size="sm" variant="outline">
              View
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">Cap Table</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Interactive cap table showing all investors and their equity positions.
          </p>
          <div className="text-xs text-muted-foreground">
            Last updated {startup.created.toLocaleDateString()} • {startup.holders} investors
          </div>
        </div>

        {/* Investor Certificate */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <TrendingUp size={24} className="text-primary" />
            </div>
            <Button size="sm" variant="outline">
              <Download size={16} className="mr-2" />
              Download
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">Investor Certificate</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Official certificate documenting your investment and equity ownership.
          </p>
          <div className="text-xs text-muted-foreground">
            Equity: {startup.equityOffered}% • PDF • 182 KB
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-card border border-border rounded-lg p-6 hover:border-primary/50 transition-colors">
          <div className="flex items-start justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center">
              <FileText size={24} className="text-primary" />
            </div>
            <Button size="sm" variant="outline">
              <Download size={16} className="mr-2" />
              Export
            </Button>
          </div>
          <h3 className="text-lg font-semibold mb-2">Transaction History</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Complete record of all your token purchases and the conversion to equity.
          </p>
          <div className="text-xs text-muted-foreground">
            All transactions • CSV, PDF • Ready to export
          </div>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-8 p-6 bg-muted/30 rounded-lg">
        <h3 className="font-semibold mb-3">Important Information</h3>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li>• All documents are legally binding and have been verified by our legal team.</li>
          <li>• Your equity percentage is based on your token holdings at the time of graduation.</li>
          <li>• SAFE agreements will convert to preferred stock during the next priced funding round.</li>
          <li>• For questions about your investment, please contact {startup.founder.name} at the company email.</li>
        </ul>
      </div>
    </div>
  );
}


