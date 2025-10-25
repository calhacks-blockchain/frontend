'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { useCreateCoinStore } from '@/lib/create-coin/form-store';
import { ArrowLeft, CheckCircle, Loader2, Rocket } from 'lucide-react';
import { formatCurrency } from '@/lib/format-utils';

interface ReviewDeployStepProps {
  onBack: () => void;
}

export function ReviewDeployStep({ onBack }: ReviewDeployStepProps) {
  const basicInfo = useCreateCoinStore((state) => state.basicInfo);
  const pitch = useCreateCoinStore((state) => state.pitch);
  const team = useCreateCoinStore((state) => state.team);
  const tractionRoadmap = useCreateCoinStore((state) => state.tractionRoadmap);
  const tokenomics = useCreateCoinStore((state) => state.tokenomics);
  const socialMedia = useCreateCoinStore((state) => state.socialMedia);
  const resetForm = useCreateCoinStore((state) => state.resetForm);
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploySuccess, setDeploySuccess] = useState(false);
  const [deployError, setDeployError] = useState('');

  const handleDeploy = async () => {
    // Prevent duplicate submissions
    if (isDeploying) {
      console.log('Deployment already in progress, ignoring duplicate request');
      return;
    }

    setIsDeploying(true);
    setDeployError('');

    try {
      // 1. Connect to Phantom wallet
      const { getPhantomProvider, isPhantomInstalled } = await import('@/lib/phantom/auth');
      
      if (!isPhantomInstalled()) {
        throw new Error('Phantom wallet not found. Please install Phantom wallet.');
      }

      const provider = getPhantomProvider();
      if (!provider) {
        throw new Error('Unable to access Phantom provider');
      }

      // Connect if not already connected
      if (!(provider as any).isConnected) {
        await provider.connect();
      }

      const walletPublicKey = provider.publicKey?.toString();
      if (!walletPublicKey) {
        throw new Error('Failed to get wallet public key');
      }

      // 2. Upload metadata (logo image + data)
      const logoFile = basicInfo.logo;
      if (!logoFile) {
        throw new Error('Logo is required');
      }

      // Convert base64/url to File if needed
      let imageFile: File;
      if (typeof logoFile === 'string') {
        const response = await fetch(logoFile);
        const blob = await response.blob();
        imageFile = new File([blob], 'logo.png', { type: blob.type });
      } else {
        imageFile = logoFile;
      }

      const formData = new FormData();
      formData.append('name', basicInfo.name || '');
      formData.append('symbol', basicInfo.ticker || '');
      formData.append('description', pitch.elevatorPitch || `${basicInfo.name || ''} - ${basicInfo.tagline || ''}`);
      formData.append('image', imageFile);

      const metadataResponse = await fetch('/api/upload-metadata', {
        method: 'POST',
        body: formData,
      });

      if (!metadataResponse.ok) {
        const error = await metadataResponse.json();
        throw new Error(error.error || 'Failed to upload metadata');
      }

      const { tokenUri } = await metadataResponse.json();

      // 3. Generate keypairs for new accounts
      const { Keypair, LAMPORTS_PER_SOL } = await import('@solana/web3.js');
      const launchpadState = Keypair.generate();
      const mint = Keypair.generate();
      const tokenVault = Keypair.generate();

      // 4. Calculate Initial Price Parameters (matching current generated client)
      const numTotalSupply = Number(basicInfo.totalSupply || '1000000');
      const numPercentage = Number(basicInfo.percentageForSale || '20');
      const numInitialValuationSOL = Number(basicInfo.valuation || '1');
      const numTargetRaiseSOL = Number(basicInfo.targetRaise || '200');

      // Validate form values
      if (!numTotalSupply || numTotalSupply <= 0) {
        throw new Error("Total supply must be greater than zero.");
      }
      if (!numPercentage || numPercentage <= 0 || numPercentage > 100) {
        throw new Error("Percentage for sale must be between 1 and 100.");
      }
      if (!numInitialValuationSOL || numInitialValuationSOL <= 0) {
        throw new Error("Initial valuation must be greater than zero.");
      }
      if (!numTargetRaiseSOL || numTargetRaiseSOL <= 0) {
        throw new Error("Target raise must be greater than zero.");
      }

      // Convert to proper token amounts with decimals
      const TOKEN_DECIMALS = 6;
      const tokenMultiplier = BigInt(10 ** TOKEN_DECIMALS);
      const totalSupply = BigInt(numTotalSupply); 
      const tokensForSale = BigInt(Math.floor(numTotalSupply * (numPercentage / 100))); 

      if (tokensForSale <= BigInt(0)) {
        throw new Error("The number of tokens for sale must be greater than zero.");
      }

      const initialValuationLamports = BigInt(Math.floor(numInitialValuationSOL * LAMPORTS_PER_SOL));
      const targetRaiseLamports = BigInt(Math.floor(numTargetRaiseSOL * LAMPORTS_PER_SOL));

      // Calculate initial price per token in lamports
      // Use a more precise calculation to avoid division by zero
      // initialPriceLamportsPerToken = (initialValuationLamports * tokenMultiplier) / totalSupply
      const initialPriceLamportsPerToken = initialValuationLamports / totalSupply;

      // Validate parameters
      if (initialPriceLamportsPerToken <= BigInt(0)) {
        throw new Error(
          `Invalid parameters. Initial valuation calculation resulted in zero or negative price. ` +
          `Valuation: ${numInitialValuationSOL} SOL, Total Supply: ${numTotalSupply}, ` +
          `Calculated Price: ${initialPriceLamportsPerToken.toString()} lamports per token.`
        );
      }

      // Remove the duplicate conversion - we already did it above
      // const totalSupply = BigInt(numTotalSupply) * tokenMultiplier; // ← REMOVE THIS
      // const tokensForSaleWithDecimals = k * tokenMultiplier; // ← REMOVE THIS

      const initResponse = await fetch('/api/initialize-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authority: walletPublicKey,
          launchpadState: launchpadState.publicKey.toString(),
          mint: mint.publicKey.toString(),
          tokenVault: tokenVault.publicKey.toString(),
          raiseTokenName: basicInfo.name,
          raiseTokenSymbol: basicInfo.ticker,
          raiseTokenUri: tokenUri,
          totalSupply: totalSupply.toString(),
          tokensForSale: tokensForSale.toString(),
          initialPriceLamportsPerToken: initialPriceLamportsPerToken.toString(),
          solRaiseTarget: targetRaiseLamports.toString(),
        }),
      });

      if (!initResponse.ok) {
        const error = await initResponse.json();
        throw new Error(error.error || 'Failed to build transaction');
      }

      const { initialize, createToken } = await initResponse.json();

      // 5. Build and send transactions (matching peterpan-front flow)
      const { Connection, Transaction, TransactionInstruction, PublicKey, SendTransactionError } = await import('@solana/web3.js');
      const connection = new Connection(
        process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
        'confirmed'
      );

      // Helper function to create instruction from payload
      const ixFromPayload = (p: { programId: string; keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[]; dataBase64: string }) =>
        new TransactionInstruction({
          programId: new PublicKey(p.programId),
          keys: p.keys.map(k => ({ ...k, pubkey: new PublicKey(k.pubkey) })),
          data: Buffer.from(p.dataBase64, 'base64'),
        });

      // Build transaction
      const transaction = new Transaction();
      transaction.add(ixFromPayload(initialize));
      transaction.add(ixFromPayload(createToken));
      transaction.feePayer = new PublicKey(walletPublicKey);

      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      transaction.recentBlockhash = blockhash;
      transaction.partialSign(launchpadState, mint, tokenVault);

      console.log("Requesting founder's signature from wallet...");
      const signedTransaction = await (provider as any).signTransaction(transaction);

      console.log("Sending fully signed transaction to the network...");

      let signature: string | undefined;
      try {
        signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
          skipPreflight: false,
          preflightCommitment: 'confirmed'
        });

        console.log("Transaction sent, waiting for confirmation...");
        const confirmation = await connection.confirmTransaction({
          signature,
          blockhash,
          lastValidBlockHeight
        }, 'confirmed');

        if (confirmation.value.err) {
          throw new Error(`Transaction failed: ${JSON.stringify(confirmation.value.err)}`);
        }

        console.log("Transaction Confirmed! Signature:", signature);
      } catch (sendError: any) {
        // Check if this is an "already processed" error first (before checking signature)
        const errorMessage = sendError?.message || String(sendError);
        const isAlreadyProcessed = errorMessage.includes('already been processed') || 
                                   errorMessage.includes('AlreadyProcessed');
        
        if (isAlreadyProcessed) {
          // This can happen if the same transaction was sent before
          console.warn("Transaction already processed - possible duplicate submission");
          
          // Try to extract signature from the signed transaction to verify
          if (!signature) {
            // We don't have a signature from sendRawTransaction, but the transaction might exist
            // Get the transaction signature from the serialized transaction
            try {
              // Import bs58 for signature encoding
              const bs58 = await import('bs58');
              const txSignature = signedTransaction.signatures[0];
              if (txSignature && txSignature.signature) {
                signature = bs58.default.encode(txSignature.signature);
                console.log("Extracted signature from transaction:", signature);
              }
            } catch (e) {
              console.warn("Could not extract signature from transaction:", e);
            }
          }
          
          if (signature) {
            // Verify the transaction status
            try {
              const status = await connection.getSignatureStatus(signature);
              if (status.value?.confirmationStatus === 'confirmed' || 
                  status.value?.confirmationStatus === 'finalized') {
                console.log("Verified transaction success:", status.value);
                // Continue with success flow
              } else if (status.value?.err) {
                throw new Error(`Transaction failed: ${JSON.stringify(status.value.err)}`);
              } else {
                console.log("Transaction status unknown, but was already processed - treating as success");
              }
            } catch (statusError) {
              console.warn("Could not verify status:", statusError);
              // Transaction was likely successful, continue
              console.log("Continuing with deployment despite verification error");
            }
          } else {
            // Can't verify without signature
            throw new Error("Transaction already processed but signature unavailable. The deployment may have succeeded - please check your wallet and refresh.");
          }
        } else if (!signature) {
          // Transaction wasn't sent and it's not an "already processed" error
          if (sendError instanceof SendTransactionError) {
            console.error("SendTransactionError details:", sendError);
            const logs = sendError.logs || [];
            throw new Error(`Transaction failed: ${sendError.message}\nLogs: ${logs.join('\n')}`);
          }
          throw sendError;
        } else if (sendError instanceof SendTransactionError) {
          console.error("SendTransactionError details:", sendError);
          const logs = sendError.logs || [];
          const errorMsg = `Transaction failed: ${sendError.message}\nLogs: ${logs.join('\n')}`;
          throw new Error(errorMsg);
        } else {
          throw sendError;
        }
      }

      // Success! Now save campaign data to database
      if (!signature) {
        throw new Error('Transaction signature is missing');
      }

      // Log explorer link for verification
      const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
      console.log(`Deployment successful! View on explorer: ${explorerUrl}`);

      try {
        const allFormData = useCreateCoinStore.getState().getAllData();
        
        const saveResponse = await fetch('/api/save-campaign', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            formData: allFormData,
            launchpadPubkey: launchpadState.publicKey.toString(),
            mintPubkey: mint.publicKey.toString(),
            tokenVaultPubkey: tokenVault.publicKey.toString(),
            authorityPubkey: walletPublicKey,
            tokenUri,
            deploymentSignature: signature,
            totalSupply: totalSupply.toString(),
            tokensForSale: tokensForSale.toString(),
            initialPriceLamportsPerToken: initialPriceLamportsPerToken.toString(),
          }),
        });

        if (!saveResponse.ok) {
          const error = await saveResponse.json();
          console.error('Failed to save campaign data:', error);
          // Don't fail the deployment if save fails, just log it
        } else {
          const saveResult = await saveResponse.json();
          console.log('Campaign data saved successfully:', saveResult);
        }
      } catch (saveError) {
        console.error('Error saving campaign data:', saveError);
        // Don't fail the deployment if save fails, just log it
      }

      setDeploySuccess(true);
      
      // Clear form and redirect after a moment
      setTimeout(() => {
        resetForm();
        window.location.href = `/coin/${launchpadState.publicKey.toString()}`;
      }, 2000);
    } catch (error) {
      console.error('Deployment error:', error);
      setDeployError(error instanceof Error ? error.message : 'Failed to deploy coin. Please try again.');
    } finally {
      setIsDeploying(false);
    }
  };

  if (deploySuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-12 space-y-6">
        <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center">
          <CheckCircle size={48} className="text-green-500" />
        </div>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-2">Coin Created Successfully! 🎉</h2>
          <p className="text-muted-foreground">
            Your coin has been deployed to the blockchain and is now live.
          </p>
        </div>
        <Button size="lg" onClick={() => window.location.href = '/'}>
          View Your Coin
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Review & Deploy</h2>
        <p className="text-muted-foreground">
          Review all your information before deploying your coin to the blockchain.
        </p>
      </div>

      {/* Basic Info Preview */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-4">
        <h3 className="font-semibold text-lg">Basic Information</h3>
        <div className="flex items-start gap-4">
          {basicInfo.logo && (
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
              <Image
                src={basicInfo.logo}
                alt={basicInfo.name || 'Logo'}
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          )}
          <div className="flex-1">
            <h4 className="text-xl font-bold">{basicInfo.name}</h4>
            <p className="text-sm text-primary">{basicInfo.ticker}</p>
            <p className="text-sm text-muted-foreground mt-1">{basicInfo.tagline}</p>
          </div>
        </div>
      </div>

      {/* The Pitch Preview */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-3">
        <h3 className="font-semibold text-lg">The Pitch</h3>
        <div className="space-y-3 text-sm">
          <div>
            <span className="font-medium">Elevator Pitch: </span>
            <span className="text-muted-foreground">{pitch.elevatorPitch}</span>
          </div>
          <div>
            <span className="font-medium">Problem: </span>
            <span className="text-muted-foreground line-clamp-2">{pitch.problem}</span>
          </div>
          <div>
            <span className="font-medium">Solution: </span>
            <span className="text-muted-foreground line-clamp-2">{pitch.solution}</span>
          </div>
        </div>
      </div>

      {/* Team Preview */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-3">
        <h3 className="font-semibold text-lg">Team ({team.team?.length || 0} members)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {team.team?.map((member, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              {member.photo && (
                <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0">
                  <Image
                    src={member.photo}
                    alt={member.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{member.name}</div>
                <div className="text-xs text-muted-foreground truncate">{member.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap Preview */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-3">
        <h3 className="font-semibold text-lg">
          Roadmap ({tractionRoadmap.roadmap?.length || 0} milestones)
        </h3>
        <div className="space-y-2">
          {tractionRoadmap.roadmap?.slice(0, 3).map((item, index) => (
            <div key={index} className="flex items-center gap-3 text-sm">
              <span className="text-xs font-semibold text-primary">{item.quarter}</span>
              <span className="truncate">{item.title}</span>
            </div>
          ))}
          {(tractionRoadmap.roadmap?.length || 0) > 3 && (
            <p className="text-xs text-muted-foreground">
              +{(tractionRoadmap.roadmap?.length || 0) - 3} more...
            </p>
          )}
        </div>
      </div>

      {/* Tokenomics Preview */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-3">
        <h3 className="font-semibold text-lg">Tokenomics</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-muted-foreground">Goal</div>
            <div className="font-semibold">{formatCurrency(tokenomics.goal || 0, 0)}</div>
          </div>
          <div>
            <div className="text-muted-foreground">Equity Offered</div>
            <div className="font-semibold">{tokenomics.equityOffered}%</div>
          </div>
          <div>
            <div className="text-muted-foreground">Founder Allocation</div>
            <div className="font-semibold">{tokenomics.founderAllocation}%</div>
          </div>
        </div>
        <div className="pt-3 border-t text-xs text-muted-foreground">
          {tokenomics.tokenDistribution?.length} distribution categories, {tokenomics.useOfFunds?.length} use of funds categories
        </div>
      </div>

      {/* Social Links Preview */}
      <div className="p-5 bg-card border border-border rounded-lg space-y-3">
        <h3 className="font-semibold text-lg">Social & Media</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {socialMedia.website && (
            <span className="px-3 py-1 bg-muted rounded-full">Website ✓</span>
          )}
          {socialMedia.twitter && (
            <span className="px-3 py-1 bg-muted rounded-full">Twitter ✓</span>
          )}
          {socialMedia.discord && (
            <span className="px-3 py-1 bg-muted rounded-full">Discord ✓</span>
          )}
          {socialMedia.telegram && (
            <span className="px-3 py-1 bg-muted rounded-full">Telegram ✓</span>
          )}
        </div>
        <div className="text-xs text-muted-foreground">
          3 showcase images • {socialMedia.tweetIds?.length || 0} featured tweets
        </div>
      </div>

      {/* Deployment Info */}
      <div className="p-5 bg-primary/5 border border-primary/20 rounded-lg space-y-3">
        <h3 className="font-semibold text-lg">Deployment Information</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Network</span>
            <span className="font-medium">Solana</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Deployment Fee</span>
            <span className="font-medium">0.1 SOL (~$20)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Estimated Time</span>
            <span className="font-medium">~30 seconds</span>
          </div>
        </div>
      </div>

      {deployError && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
          {deployError}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onBack}
          disabled={isDeploying}
          className="gap-2"
        >
          <ArrowLeft size={16} />
          Back
        </Button>
        <Button
          onClick={handleDeploy}
          disabled={isDeploying}
          size="lg"
          className="gap-2"
        >
          {isDeploying ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              Deploying...
            </>
          ) : (
            <>
              <Rocket size={20} />
              Deploy Coin
            </>
          )}
        </Button>
      </div>
    </div>
  );
}

