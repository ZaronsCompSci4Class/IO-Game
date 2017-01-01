import java.awt.*;
import java.awt.event.*;
import java.awt.image.BufferedImage;
import javax.imageio.ImageIO;
import java.io.*;
import java.applet.Applet;

/**
 * Write a description of class ObjectMapper here.
 * 
 * @author (your name) 
 * @version (a version number or a date)
 */
public class ObjectMapper extends Applet implements MouseMotionListener
{   
	private final int SCALE = 8;
	private BufferedImage img;
	
    public void init() {
        try {
            img = ImageIO.read(new File("../../../objectMap.png"));
            addMouseMotionListener(new ObjectMapper());
        } catch (IOException e){
        	System.out.println(e);
        }
    }
    
    public void paint(Graphics g) {
        g.drawImage(img,0,0,null);
        Point p = MouseInfo.getPointerInfo().getLocation();
        int x = (int)(p.getX());
        int y = (int)(p.getY());
        g.setColor(Color.GRAY);
        g.drawRect(x,y,SCALE,SCALE);
        System.out.println(Math.random());
    }
    
    public void mouseMoved (MouseEvent e) {
    	repaint();
    	System.out.println("d");
    }

	public void mouseDragged(MouseEvent e) {
		
	}
}