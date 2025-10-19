#![allow(unexpected_cfgs)]
use anchor_lang::prelude::*;

declare_id!("8a1iB4a3FmaFnPZ7d2j7yVYTxpr21w69A6CsiDrsTkCq");

#[program]
pub mod stealthboard {
    use super::*;

    /// Commit or update merkle root
    /// Increments version if root changes
    pub fn commit_root(
        ctx: Context<CommitRoot>,
        merkle_root: [u8; 32],
        metadata: CommitMetadata,
    ) -> Result<()> {
        let commitment = &mut ctx.accounts.commitment;
        
        // Initialize if new
        if commitment.owner == Pubkey::default() {
            commitment.owner = ctx.accounts.owner.key();
            commitment.bump = ctx.bumps.commitment;
            commitment.version = 1;
        } else {
            // Increment version if root changed
            if commitment.merkle_root != merkle_root {
                commitment.version += 1;
            }
        }
        
        commitment.merkle_root = merkle_root;
        commitment.metadata = metadata;
        commitment.timestamp = Clock::get()?.unix_timestamp;
        commitment.revoked = false; // Reset on update

        emit!(RootCommitted {
            owner: commitment.owner,
            commitment_address: commitment.key(),
            merkle_root,
            version: commitment.version,
            timestamp: commitment.timestamp,
        });

        Ok(())
    }

    /// Revoke ALL share links (nuclear option)
    pub fn revoke_all(ctx: Context<RevokeCommitment>) -> Result<()> {
        let commitment = &mut ctx.accounts.commitment;
        
        require!(!commitment.revoked, ErrorCode::AlreadyRevoked);
        
        commitment.revoked = true;

        emit!(CommitmentRevoked {
            owner: commitment.owner,
            commitment_address: commitment.key(),
            revoked_at: Clock::get()?.unix_timestamp,
        });

        Ok(())
    }
}

#[derive(Accounts)]
pub struct CommitRoot<'info> {
    #[account(
        init_if_needed,
        payer = owner,
        space = 8 + ShareCommitment::INIT_SPACE,
        seeds = [b"commitment", owner.key().as_ref()],
        bump
    )]
    pub commitment: Account<'info, ShareCommitment>,
    
    #[account(mut)]
    pub owner: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct RevokeCommitment<'info> {
    #[account(
        mut,
        seeds = [b"commitment", owner.key().as_ref()],
        bump = commitment.bump,
        has_one = owner @ ErrorCode::Unauthorized,
    )]
    pub commitment: Account<'info, ShareCommitment>,
    
    pub owner: Signer<'info>,
}

#[account]
#[derive(InitSpace)]
pub struct ShareCommitment {
    pub owner: Pubkey,
    pub merkle_root: [u8; 32],
    pub version: u32,               // NEW: increments on root change
    pub metadata: CommitMetadata,
    pub timestamp: i64,
    pub revoked: bool,              // Global revocation
    pub bump: u8,
}

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace)]
pub struct CommitMetadata {
    #[max_len(10)]
    pub chain: String,
    pub snapshot_timestamp: i64,
    pub expires_at: Option<i64>,
    pub privacy_score: u8,
}

#[event]
pub struct RootCommitted {
    pub owner: Pubkey,
    pub commitment_address: Pubkey,
    pub merkle_root: [u8; 32],
    pub version: u32,
    pub timestamp: i64,
}

#[event]
pub struct CommitmentRevoked {
    pub owner: Pubkey,
    pub commitment_address: Pubkey,
    pub revoked_at: i64,
}

#[error_code]
pub enum ErrorCode {
    #[msg("Commitment has already been revoked")]
    AlreadyRevoked,
    
    #[msg("Only the owner can perform this action")]
    Unauthorized,
}





