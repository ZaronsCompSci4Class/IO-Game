import java.awt.event.MouseEvent;
import javax.swing.event.MouseInputAdapter;

public class mListener extends MouseInputAdapter {
	public void mouseMoved(MouseEvent e) {
		int x = e.getX();
		int y = e.getY();
	}
}
