import Badge from "react-bootstrap/Badge";
import CloseButton from "react-bootstrap/CloseButton";
import { categoryVariant } from "../utils/skills";

// one skill, wherever it is being shown: in a portfolio, down a network list, or
// in the catalogue. the colour says which bucket it belongs to, so a row of
// chips reads as a shape before it is read as words
function SkillBadge({ skill, onRemove, removeLabel, disabled }) {
  return (
    <Badge
      bg={categoryVariant(skill.category)}
      className="skill-chip d-inline-flex align-items-center gap-1"
    >
      {skill.name}
      {/* the cross belongs to the chip rather than sitting beside it, so there
          is no doubt which skill it would take away */}
      {onRemove && (
        <CloseButton
          variant="white"
          aria-label={removeLabel ?? `Remove ${skill.name}`}
          title={removeLabel ?? `Remove ${skill.name}`}
          disabled={disabled}
          onClick={() => onRemove(skill)}
        />
      )}
    </Badge>
  );
}

export default SkillBadge;
