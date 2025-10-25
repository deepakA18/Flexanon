
export const IDL = {
  "address": "79WokvRaKKnw4Ay73s6HGMn9ZJVcxBmsufEGH8imxTAn",
  "metadata": {
    "name": "flexanon",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "commitRoot",
      "discriminator": [
        142,
        242,
        81,
        248,
        39,
        238,
        194,
        125
      ],
      "accounts": [
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "userWallet"
              }
            ]
          }
        },
        {
          "name": "relayer",
          "docs": [
            "The relayer who pays for the transaction",
            "This wallet appears on-chain, not the user's!"
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "userWallet",
          "type": "pubkey"
        },
        {
          "name": "merkleRoot",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "metadata",
          "type": {
            "defined": {
              "name": "commitMetadata"
            }
          }
        }
      ]
    },
    {
      "name": "revokeAll",
      "docs": [
        "Revoke ALL share links (nuclear option)"
      ],
      "discriminator": [
        147,
        196,
        234,
        31,
        86,
        199,
        8,
        234
      ],
      "accounts": [
        {
          "name": "commitment",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  99,
                  111,
                  109,
                  109,
                  105,
                  116,
                  109,
                  101,
                  110,
                  116
                ]
              },
              {
                "kind": "account",
                "path": "owner"
              }
            ]
          }
        },
        {
          "name": "owner",
          "signer": true,
          "relations": [
            "commitment"
          ]
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "shareCommitment",
      "discriminator": [
        103,
        111,
        99,
        87,
        182,
        74,
        159,
        55
      ]
    }
  ],
  "events": [
    {
      "name": "commitmentRevoked",
      "discriminator": [
        192,
        52,
        75,
        249,
        4,
        195,
        166,
        27
      ]
    },
    {
      "name": "rootCommitted",
      "discriminator": [
        30,
        165,
        181,
        147,
        255,
        244,
        51,
        73
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "alreadyRevoked",
      "msg": "Commitment has already been revoked"
    },
    {
      "code": 6001,
      "name": "unauthorized",
      "msg": "Only the owner can perform this action"
    }
  ],
  "types": [
    {
      "name": "commitMetadata",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "chain",
            "type": "string"
          },
          {
            "name": "snapshotTimestamp",
            "type": "i64"
          },
          {
            "name": "expiresAt",
            "type": {
              "option": "i64"
            }
          },
          {
            "name": "privacyScore",
            "type": "u8"
          }
        ]
      }
    },
    {
      "name": "commitmentRevoked",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "commitmentAddress",
            "type": "pubkey"
          },
          {
            "name": "revokedAt",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "rootCommitted",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "commitmentAddress",
            "type": "pubkey"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "version",
            "type": "u32"
          },
          {
            "name": "timestamp",
            "type": "i64"
          }
        ]
      }
    },
    {
      "name": "shareCommitment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "owner",
            "type": "pubkey"
          },
          {
            "name": "merkleRoot",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "version",
            "type": "u32"
          },
          {
            "name": "metadata",
            "type": {
              "defined": {
                "name": "commitMetadata"
              }
            }
          },
          {
            "name": "timestamp",
            "type": "i64"
          },
          {
            "name": "revoked",
            "type": "bool"
          },
          {
            "name": "bump",
            "type": "u8"
          }
        ]
      }
    }
  ]
};
