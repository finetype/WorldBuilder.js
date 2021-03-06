import * as BattleShared from './battle-shared'

type Unit = App.Unit
type Skill = App.Skill
type UnitId = App.UnitId
type Effect = App.Effect
type GameState = App.GameState
type BattleAction = App.BattleAction

//
// Re-export shared methods for server convenience
//
export * from './battle-shared'


export function handleAction(game: GameState, actorId: UnitId, action: BattleAction): Effect[] {

  if ( action.type === 'skill' ) {

    var skill = game.meta.skills.find( s => s.name === action.skill )

    if ( ! skill ) return [{ type: 'invalid-action', message: `No such skill: ${action.skill}` }]

    //
    // If spell is a single target, make sure the target is valid
    //
    if ( skill.target.type === 'single' ) {
      if ( typeof action.target !== 'string' ) return [];

      let target = game.units[ action.target ]
      if ( ! target ) return [];

      let validTargets = BattleShared.getValidTargets(game, actorId, action)

      if ( Array.isArray(validTargets) && ! validTargets.includes(target.id) ) {
        return [{ type: 'invalid-action', message: `Invalid target ${target.name}` }]
      }

      return handleSingleTargetSkill(game, actorId, skill, target)
    }
    else if ( skill.target.type === 'radius' ) {
      // TODO: Handle AoE skills
    }
  }

  return []
}

function handleSingleTargetSkill (game: GameState, actorId: UnitId, skill: Skill, target: Unit): Effect[] {
  game.intents[actorId] = { type: 'target-unit', target: target.id, skillName: skill.name }
  delete game.pendingDecisions[actorId]

  if ( game.mode === 'battle' ) {
    game.timeline[actorId] = { type: 'act', current: 0, target: game.meta.fps * (skill.time.limit) }
  }

  return [{ type: 'battle:decision:skill:target', actorId: actorId, targetId: target.id, skillName: skill.name }]
}
