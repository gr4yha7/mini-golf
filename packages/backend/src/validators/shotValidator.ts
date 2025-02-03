import type { Hex } from 'viem'
import { keccak256, encodePacked } from 'viem'
import { z } from 'zod'

const ShotParamsSchema = z.object({
  gameId: z.string(),
  power: z.number().min(0).max(100),
  angle: z.number().min(0).max(359),
  playerAddress: z.string().startsWith('0x')
})

type ShotParams = z.infer<typeof ShotParamsSchema>

interface ValidationResult {
  isValid: boolean
  commitment?: Hex
  error?: string
}

interface ShotValidation {
  power: number;
  angle: number;
  playerAddress: string;
  commitment: string;
}

export class ShotValidator {
  private readonly maxPower = 100
  private readonly maxAngle = 359

  validateShot(params: ShotParams): ValidationResult {
    const result = ShotParamsSchema.safeParse(params)
    
    if (!result.success) {
      return {
        isValid: false,
        error: result.error.message
      }
    }

    const { power, angle, playerAddress } = params

    // Basic parameter validation
    if (power > this.maxPower) {
      return {
        isValid: false,
        error: 'Power exceeds maximum'
      }
    }

    if (angle > this.maxAngle) {
      return {
        isValid: false,
        error: 'Invalid angle'
      }
    }

    // Create shot commitment
    const commitment = keccak256(
      encodePacked(
        ['uint256', 'uint256', 'address'],
        [BigInt(power), BigInt(angle), playerAddress as Hex]
      )
    )

    return {
      isValid: true,
      commitment
    }
  }

  validatePhysics(params: ShotParams): boolean {
    // TODO: Add physics validation
    return true
  }

  validateShotValidation({ power, angle, playerAddress, commitment }: ShotValidation): boolean {
    const calculatedCommitment = keccak256(
      encodePacked(
        ['uint256', 'uint256', 'address'],
        [BigInt(power), BigInt(angle), playerAddress as `0x${string}`]
      )
    );

    return calculatedCommitment === commitment;
  }
} 