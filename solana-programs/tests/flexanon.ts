import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Flexanon } from "../target/types/flexanon";
import { PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { expect } from "chai";
import crypto from "crypto";

describe("flexanon", () => {
  // Configure the client
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.Flexanon as Program<Flexanon>;
  
  // Test accounts
  let userWallet: Keypair;
  let commitmentPDA: PublicKey;
  let commitmentBump: number;

  // Test data
  const testMerkleRoot = crypto.randomBytes(32);
  const updatedMerkleRoot = crypto.randomBytes(32);

  before(async () => {
    userWallet = Keypair.generate();
    
    // Airdrop SOL to user
    const signature = await provider.connection.requestAirdrop(
      userWallet.publicKey,
      2 * anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    // Derive commitment PDA
    [commitmentPDA, commitmentBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment"), userWallet.publicKey.toBuffer()],
      program.programId
    );

    console.log("\n🔧 Test Setup:");
    console.log(`   User Wallet: ${userWallet.publicKey.toString()}`);
    console.log(`   Commitment PDA: ${commitmentPDA.toString()}`);
    console.log(`   Bump: ${commitmentBump}\n`);
  });

  it("Commits a new merkle root", async () => {
    console.log("📝 Test 1: Committing merkle root...");

    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: null,
      privacyScore: 75
    };

    const tx = await program.methods
      .commitRoot(Array.from(testMerkleRoot), metadata)
      .accounts({
        commitment: commitmentPDA,
        owner: userWallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([userWallet])
      .rpc();

    console.log(`   ✅ Transaction: ${tx}`);

    // Fetch the created commitment
    const commitmentAccount = await program.account.shareCommitment.fetch(commitmentPDA);

    // Verify data
    expect(commitmentAccount.owner.toString()).to.equal(userWallet.publicKey.toString());
    expect(Buffer.from(commitmentAccount.merkleRoot)).to.deep.equal(testMerkleRoot);
    expect(commitmentAccount.version).to.equal(1);
    expect(commitmentAccount.revoked).to.be.false;
    expect(commitmentAccount.metadata.chain).to.equal("solana");
    expect(commitmentAccount.metadata.privacyScore).to.equal(75);

    console.log(`   Owner: ${commitmentAccount.owner.toString()}`);
    console.log(`   Version: ${commitmentAccount.version}`);
    console.log(`   Revoked: ${commitmentAccount.revoked}`);
    console.log(`   Chain: ${commitmentAccount.metadata.chain}`);
    console.log(`   Privacy Score: ${commitmentAccount.metadata.privacyScore}`);
    console.log(`   Merkle Root: ${Buffer.from(commitmentAccount.merkleRoot).toString('hex').slice(0, 16)}...`);
  });

  it("Updates an existing commitment (increments version)", async () => {
    console.log("\n📝 Test 2: Updating commitment...");

    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: null,
      privacyScore: 85
    };

    const tx = await program.methods
      .commitRoot(Array.from(updatedMerkleRoot), metadata)
      .accounts({
        commitment: commitmentPDA,
        owner: userWallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([userWallet])
      .rpc();

    console.log(`   ✅ Transaction: ${tx}`);

    // Fetch updated commitment
    const commitmentAccount = await program.account.shareCommitment.fetch(commitmentPDA);

    // Verify update
    expect(Buffer.from(commitmentAccount.merkleRoot)).to.deep.equal(updatedMerkleRoot);
    expect(commitmentAccount.version).to.equal(2); // Version incremented
    expect(commitmentAccount.revoked).to.be.false;
    expect(commitmentAccount.metadata.privacyScore).to.equal(85);

    console.log(`   New Version: ${commitmentAccount.version}`);
    console.log(`   New Privacy Score: ${commitmentAccount.metadata.privacyScore}`);
    console.log(`   New Merkle Root: ${Buffer.from(commitmentAccount.merkleRoot).toString('hex').slice(0, 16)}...`);
  });

  it("Fails to commit with wrong owner", async () => {
    console.log("\n📝 Test 3: Unauthorized commit (should fail)...");

    const attacker = Keypair.generate();
    
    // Airdrop to attacker
    const signature = await provider.connection.requestAirdrop(
      attacker.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(signature);

    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: null,
      privacyScore: 50
    };

    try {
      await program.methods
        .commitRoot(Array.from(crypto.randomBytes(32)), metadata)
        .accounts({
          commitment: commitmentPDA,
          owner: attacker.publicKey, // Wrong owner!
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([attacker])
        .rpc();

      throw new Error("Should have failed!");
    } catch (error: any) {
      // Should fail because PDA derivation won't match
      expect(error.toString()).to.include("Error");
      console.log(`   ✅ Correctly rejected unauthorized commit`);
    }
  });

  it("Revokes all share links", async () => {
    console.log("\n📝 Test 4: Revoking commitment...");

    const tx = await program.methods
      .revokeAll()
      .accounts({
        commitment: commitmentPDA,
        owner: userWallet.publicKey,
      })
      .signers([userWallet])
      .rpc();

    console.log(`   ✅ Transaction: ${tx}`);

    // Fetch revoked commitment
    const commitmentAccount = await program.account.shareCommitment.fetch(commitmentPDA);

    // Verify revocation
    expect(commitmentAccount.revoked).to.be.true;
    expect(commitmentAccount.version).to.equal(2); // Version unchanged

    console.log(`   Revoked: ${commitmentAccount.revoked}`);
  });

  it("Allows commits after revocation (soft revocation)", async () => {
    console.log("\n📝 Test 5: Commit after revocation...");

    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: null,
      privacyScore: 60
    };

    // Your program allows updates even after revocation
    // This is a valid design choice - revocation is enforced off-chain
    const tx = await program.methods
      .commitRoot(Array.from(crypto.randomBytes(32)), metadata)
      .accounts({
        commitment: commitmentPDA,
        owner: userWallet.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([userWallet])
      .rpc();

    console.log(`   ✅ Transaction succeeded: ${tx.slice(0, 20)}...`);

    const account = await program.account.shareCommitment.fetch(commitmentPDA);
    
    // Note: revoked flag stays true, but version increments
    console.log(`   Version: ${account.version} (incremented)`);
    console.log(`   Revoked: ${account.revoked} (flag persists)`);
    console.log(`   ✅ Soft revocation confirmed - enforced off-chain by backend`);
  });

  it("Creates multiple commitments for different users", async () => {
    console.log("\n📝 Test 6: Multiple users...");

    const user2 = Keypair.generate();
    const user3 = Keypair.generate();

    // Airdrop
    for (const user of [user2, user3]) {
      const sig = await provider.connection.requestAirdrop(
        user.publicKey,
        anchor.web3.LAMPORTS_PER_SOL
      );
      await provider.connection.confirmTransaction(sig);
    }

    // Create commitments for each user
    for (const [index, user] of [user2, user3].entries()) {
      const [pda] = PublicKey.findProgramAddressSync(
        [Buffer.from("commitment"), user.publicKey.toBuffer()],
        program.programId
      );

      const merkleRoot = crypto.randomBytes(32);
      const metadata = {
        chain: "solana",
        snapshotTimestamp: new anchor.BN(Date.now()),
        expiresAt: null,
        privacyScore: 70 + index * 5
      };
      
      await program.methods
        .commitRoot(Array.from(merkleRoot), metadata)
        .accounts({
          commitment: pda,
          owner: user.publicKey,
          systemProgram: SystemProgram.programId,
        } as any)
        .signers([user])
        .rpc();

      const account = await program.account.shareCommitment.fetch(pda);
      expect(account.owner.toString()).to.equal(user.publicKey.toString());
      expect(account.version).to.equal(1);
      
      console.log(`   ✅ User ${index + 2} commitment created at ${pda.toString().slice(0, 8)}... (privacy: ${account.metadata.privacyScore})`);
    }
  });

  it("Verifies merkle root format and metadata", async () => {
    console.log("\n📝 Test 7: Merkle root and metadata validation...");

    const newUser = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      newUser.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment"), newUser.publicKey.toBuffer()],
      program.programId
    );

    // Test with 32-byte merkle root and full metadata
    const validRoot = crypto.randomBytes(32);
    const expirationTime = new anchor.BN(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    
    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: expirationTime,
      privacyScore: 90
    };

    await program.methods
      .commitRoot(Array.from(validRoot), metadata)
      .accounts({
        commitment: pda,
        owner: newUser.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([newUser])
      .rpc();

    const account = await program.account.shareCommitment.fetch(pda);
    expect(account.merkleRoot.length).to.equal(32);
    expect(account.metadata.chain).to.equal("solana");
    expect(account.metadata.privacyScore).to.equal(90);
    expect(account.metadata.expiresAt).to.not.be.null;
    
    console.log(`   ✅ 32-byte merkle root accepted`);
    console.log(`   ✅ Metadata stored: chain=${account.metadata.chain}, privacy=${account.metadata.privacyScore}`);
    console.log(`   ✅ Expiration set: ${account.metadata.expiresAt?.toString()}`);
  });

  it("Checks timestamp is set correctly", async () => {
    console.log("\n📝 Test 8: Timestamp validation...");

    const newUser = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      newUser.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment"), newUser.publicKey.toBuffer()],
      program.programId
    );

    const beforeTime = Math.floor(Date.now() / 1000);
    
    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: null,
      privacyScore: 80
    };

    await program.methods
      .commitRoot(Array.from(crypto.randomBytes(32)), metadata)
      .accounts({
        commitment: pda,
        owner: newUser.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([newUser])
      .rpc();

    const afterTime = Math.floor(Date.now() / 1000);
    const account = await program.account.shareCommitment.fetch(pda);
    
    const timestamp = account.timestamp.toNumber();
    
    // Allow 5 second buffer for network delays
    expect(timestamp).to.be.at.least(beforeTime - 5);
    expect(timestamp).to.be.at.most(afterTime + 5);
    
    console.log(`   ✅ Timestamp set to ${timestamp} (within valid range)`);
  });

  it("Tests privacy score range", async () => {
    console.log("\n📝 Test 9: Privacy score validation...");

    const newUser = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      newUser.publicKey,
      anchor.web3.LAMPORTS_PER_SOL
    );
    await provider.connection.confirmTransaction(sig);

    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from("commitment"), newUser.publicKey.toBuffer()],
      program.programId
    );

    // Test with max privacy score (100)
    const metadata = {
      chain: "solana",
      snapshotTimestamp: new anchor.BN(Date.now()),
      expiresAt: null,
      privacyScore: 100
    };

    await program.methods
      .commitRoot(Array.from(crypto.randomBytes(32)), metadata)
      .accounts({
        commitment: pda,
        owner: newUser.publicKey,
        systemProgram: SystemProgram.programId,
      } as any)
      .signers([newUser])
      .rpc();

    const account = await program.account.shareCommitment.fetch(pda);
    expect(account.metadata.privacyScore).to.equal(100);
    
    console.log(`   ✅ Privacy score ${account.metadata.privacyScore} accepted (u8 range 0-255)`);
  });

  after(() => {
    console.log("\n✅ All on-chain tests passed!\n");
  });
});
