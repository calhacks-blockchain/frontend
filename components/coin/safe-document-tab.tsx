'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FileText, Download, CheckCircle, Loader2 } from 'lucide-react';

interface SafeDocumentTabProps {
  launchpadAddress: string;
  safeDocumentUrl?: string;
  currentStatus?: string;
  onGraduated?: () => void;
}

export function SafeDocumentTab({ 
  launchpadAddress, 
  safeDocumentUrl,
  currentStatus,
  onGraduated 
}: SafeDocumentTabProps) {
  // If status is Safe, the document is already signed and graduated
  const isAlreadyGraduated = currentStatus === 'Safe';
  
  const [signing, setSigning] = useState(false);
  const [signed, setSigned] = useState(isAlreadyGraduated);
  const [graduating, setGraduating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualDocUrl, setManualDocUrl] = useState<string | null>(null);
  
  // Fallback: try to construct document URL if not provided
  const effectiveDocUrl = safeDocumentUrl || manualDocUrl;

  // Try to fetch document URL if not provided
  useEffect(() => {
    if (!safeDocumentUrl && isAlreadyGraduated) {
      const tryFetchDocument = async () => {
        try {
          console.log('Attempting to fetch SAFE document for graduated campaign...');
          const response = await fetch('http://localhost:5001/api/check-and-generate-safe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ launchpadStateAddress: launchpadAddress })
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.safeDocument?.pdfUrl) {
              setManualDocUrl(data.safeDocument.pdfUrl);
              console.log('✅ Retrieved document URL:', data.safeDocument.pdfUrl);
            }
          }
        } catch (err) {
          console.error('Failed to fetch SAFE document:', err);
        }
      };
      
      tryFetchDocument();
    }
  }, [safeDocumentUrl, isAlreadyGraduated, launchpadAddress]);

  const handleDownload = async () => {
    if (!effectiveDocUrl) {
      alert('SAFE document URL not available. Please try refreshing the page.');
      return;
    }

    try {
      const fullUrl = effectiveDocUrl.startsWith('http') 
        ? effectiveDocUrl 
        : `http://localhost:8000${effectiveDocUrl}`;
      
      console.log('Downloading SAFE document from:', fullUrl);
      
      // Fetch the file and trigger download
      const response = await fetch(fullUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download: ${response.statusText}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = effectiveDocUrl.split('/').pop() || 'SAFE_Document.docx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log('✅ Download successful');
    } catch (err) {
      console.error('Download error:', err);
      alert(`Failed to download document: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  };

  const handleSign = async () => {
    setSigning(true);
    setError(null);

    try {
      // Simulate signing process (in real app, would use e-signature service)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setSigned(true);
      setSigning(false);

      // Show success message
      alert('✅ Document signed successfully!\n\nClick "Graduate to SAFE" to finalize.');

    } catch (err) {
      setError('Failed to sign document');
      setSigning(false);
    }
  };

  const handleGraduate = async () => {
    if (!signed) {
      alert('Please sign the SAFE document first.');
      return;
    }

    setGraduating(true);
    setError(null);

    try {
      console.log('Calling graduate endpoint with:', { launchpadStateAddress: launchpadAddress });

      // Call the graduate endpoint - backend handles the entire transaction
      const response = await fetch('http://localhost:5001/api/graduate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          launchpadStateAddress: launchpadAddress
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to graduate');
      }

      console.log('🎉 Graduation successful!', data);
      
      alert(`🎉 Congratulations!\n\nYour campaign has successfully graduated to SAFE status.\n\nTransaction: ${data.signature}\n\nAll token holders now have legal equity claims.`);
      
      if (onGraduated) {
        onGraduated();
      }

      // Reload page to show new status
      window.location.reload();

    } catch (err) {
      console.error('Graduate error:', err);
      setError(err instanceof Error ? err.message : 'Failed to graduate');
      setGraduating(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold">SAFE Document</h2>
          <p className="text-muted-foreground mt-1">
            Simple Agreement for Future Equity - Generated by AI
          </p>
          {/* Debug info - only in development */}
          {!effectiveDocUrl && (
            <p className="text-xs text-red-500 mt-1">
              ⚠️ Document URL not loaded. Try refreshing the page.
            </p>
          )}
          {manualDocUrl && !safeDocumentUrl && (
            <p className="text-xs text-green-600 mt-1">
              ✓ Document retrieved from cache
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {signed && (
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle className="w-5 h-5" />
              <span className="text-sm font-medium">Signed</span>
            </div>
          )}
        </div>
      </div>

      {/* Document Preview Card */}
      <Card className="p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-20 bg-muted rounded flex items-center justify-center">
            <FileText className="w-8 h-8 text-muted-foreground" />
          </div>
          
          <div className="flex-1">
            <h3 className="font-semibold text-lg mb-2">
              SAFE Agreement Document
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              This document contains the Simple Agreement for Future Equity (SAFE) with terms 
              based on your fundraising campaign. All token holders will receive legal equity claims.
            </p>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Document Type:</span>
                <span className="font-medium">Postmoney SAFE - Valuation Cap Only</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status:</span>
                <span className="font-medium">
                  {isAlreadyGraduated ? '✅ Signed & Graduated' : signed ? '✅ Signed' : '⏳ Awaiting Signature'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Campaign Status:</span>
                <span className="font-medium">
                  {isAlreadyGraduated ? '🎉 Graduated to SAFE' : 'In Transition'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Format:</span>
                <span className="font-medium">Microsoft Word (.docx)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex gap-3">
          <Button
            onClick={handleDownload}
            variant="outline"
            disabled={!effectiveDocUrl}
          >
            <Download className="w-4 h-4 mr-2" />
            Download Document
          </Button>

          {!signed && !isAlreadyGraduated && (
            <Button
              onClick={handleSign}
              disabled={signing || !effectiveDocUrl}
            >
              {signing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Signing...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4 mr-2" />
                  Sign Document
                </>
              )}
            </Button>
          )}
        </div>
      </Card>

      {/* What Happens Next */}
      {!isAlreadyGraduated && (
        <Card className="p-6 bg-muted/50">
          <h3 className="font-semibold mb-3">What Happens Next?</h3>
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li className="flex gap-2">
              <span className="font-medium">1.</span>
              <span>Download and review the SAFE document carefully</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">2.</span>
              <span>Sign the document electronically using the button above</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">3.</span>
              <span>Click "Graduate to SAFE" to finalize the conversion</span>
            </li>
            <li className="flex gap-2">
              <span className="font-medium">4.</span>
              <span>All token holders will automatically receive their equity claims</span>
            </li>
          </ol>
        </Card>
      )}

      {/* Already Graduated Message */}
      {isAlreadyGraduated && (
        <Card className="p-6 bg-green-50 dark:bg-green-950/20 border-green-200">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Campaign Successfully Graduated! 🎉
              </h3>
              <p className="text-sm text-muted-foreground mb-3">
                This campaign has been officially graduated to SAFE status. The document has been 
                signed and all token holders now have legal equity claims in the company.
              </p>
              <div className="text-sm space-y-1">
                <p><strong>✅ Document Status:</strong> Signed & Executed</p>
                <p><strong>✅ Equity Status:</strong> Active</p>
                <p><strong>✅ Token Conversion:</strong> Complete</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Graduate Button */}
      {signed && !isAlreadyGraduated && (
        <Card className="p-6 border-green-200 bg-green-50 dark:bg-green-950/20">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg mb-2">
                Ready to Graduate! 🎉
              </h3>
              <p className="text-sm text-muted-foreground">
                The SAFE document has been signed. Click the button below to officially 
                graduate your campaign and convert all tokens to legal equity claims.
              </p>
            </div>
            <Button
              onClick={handleGraduate}
              disabled={graduating}
              size="lg"
              className="bg-green-600 hover:bg-green-700"
            >
              {graduating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Graduating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Graduate to SAFE
                </>
              )}
            </Button>
          </div>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {/* Legal Disclaimer */}
      <Card className="p-4 bg-muted/30">
        <p className="text-xs text-muted-foreground">
          <strong>Legal Disclaimer:</strong> This document was generated by AI based on your 
          fundraising terms. Before signing, please review the document carefully and consult 
          with legal counsel. This platform does not provide legal advice.
        </p>
      </Card>
    </div>
  );
}

